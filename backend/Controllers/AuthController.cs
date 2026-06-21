using Microsoft.AspNetCore.Mvc;
using InvoiceSystem.Services;
using InvoiceSystem.Models;

namespace InvoiceSystem.Controllers;

[Route("api/[controller]")]
[ApiController]
public class AuthController : ControllerBase
{
    private readonly AuthService _authService;
    private readonly ILogger<AuthController> _logger;

    public AuthController(AuthService authService, ILogger<AuthController> logger)
    {
        _authService = authService;
        _logger = logger;
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        if (string.IsNullOrEmpty(request.Email) || string.IsNullOrEmpty(request.Password))
        {
            return BadRequest(new { message = "Email and password are required" });
        }

        var result = await _authService.LoginAsync(request.Email, request.Password);

        if (!result.Success)
        {
            return Unauthorized(new { message = result.Message });
        }

        return Ok(new
        {
            token = result.Token,
            email = request.Email,
            expiresAt = DateTime.UtcNow.AddDays(30)
        });
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request)
    {
        // Validate user account fields
        if (string.IsNullOrEmpty(request.Email) || 
            string.IsNullOrEmpty(request.Password) ||
            string.IsNullOrEmpty(request.FullName))
        {
            return BadRequest(new { message = "Email, password, and full name are required" });
        }

        // Validate business profile fields
        if (request.BusinessProfile == null ||
            string.IsNullOrEmpty(request.BusinessProfile.BusinessName) ||
            string.IsNullOrEmpty(request.BusinessProfile.BusinessAddress) ||
            string.IsNullOrEmpty(request.BusinessProfile.PhoneNumber) ||
            string.IsNullOrEmpty(request.BusinessProfile.VatNumber) ||
            string.IsNullOrEmpty(request.BusinessProfile.AccountNumber))
        {
            return BadRequest(new { message = "All business profile fields are required" });
        }

        var result = await _authService.RegisterUserAsync(
            request.Email,
            request.Password,
            request.FullName,
            request.BusinessProfile
        );

        if (!result.Success)
        {
            return BadRequest(new { message = result.Message });
        }

        return Ok(new { message = result.Message });
    }

    [HttpPost("change-password")]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest request)
    {
        var email = User.Identity?.Name;
        if (string.IsNullOrEmpty(email))
        {
            return Unauthorized(new { message = "User not authenticated" });
        }

        var result = await _authService.ChangePasswordAsync(
            email,
            request.CurrentPassword,
            request.NewPassword
        );

        if (!result.Success)
        {
            return BadRequest(new { message = result.Message });
        }

        return Ok(new { message = result.Message });
    }

    [HttpGet("business-profile")]
    public async Task<IActionResult> GetBusinessProfile()
    {
        var email = User.Identity?.Name;
        if (string.IsNullOrEmpty(email))
        {
            return Unauthorized(new { message = "User not authenticated" });
        }

        var profile = await _authService.GetBusinessProfileByEmailAsync(email);
        if (profile == null)
        {
            return NotFound(new { message = "Business profile not found" });
        }

        return Ok(profile);
    }

    [HttpPut("business-profile")]
    public async Task<IActionResult> UpdateBusinessProfile([FromBody] BusinessProfile updatedProfile)
    {
        var email = User.Identity?.Name;
        if (string.IsNullOrEmpty(email))
        {
            return Unauthorized(new { message = "User not authenticated" });
        }

        var result = await _authService.UpdateBusinessProfileAsync(email, updatedProfile);
        
        if (!result.Success)
        {
            return BadRequest(new { message = result.Message });
        }

        return Ok(new { message = result.Message });
    }

    [HttpGet("next-invoice-number")]
    public async Task<IActionResult> GetNextInvoiceNumber()
    {
        var email = User.Identity?.Name;
        if (string.IsNullOrEmpty(email))
        {
            return Unauthorized(new { message = "User not authenticated" });
        }

        var profile = await _authService.GetBusinessProfileByEmailAsync(email);
        if (profile == null)
        {
            return NotFound(new { message = "Business profile not found" });
        }

        var invoiceNumber = await _authService.GetNextInvoiceNumberAsync(profile.Id);
        if (invoiceNumber == null)
        {
            return BadRequest(new { message = "Failed to generate invoice number" });
        }

        return Ok(new { invoiceNumber });
    }
}

public class LoginRequest
{
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}

public class RegisterRequest
{
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public BusinessProfile BusinessProfile { get; set; } = new BusinessProfile();
}

public class ChangePasswordRequest
{
    public string CurrentPassword { get; set; } = string.Empty;
    public string NewPassword { get; set; } = string.Empty;
}