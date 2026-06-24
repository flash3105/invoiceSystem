using Microsoft.AspNetCore.Mvc;
using InvoiceSystem.Services;
using InvoiceSystem.Models;
using InvoiceSystem.Models.DTOs;

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
        try
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

            // Map to DTO
            var dto = new BusinessProfileDto
            {
                Id = profile.Id,
                UserId = profile.UserId,
                BusinessName = profile.BusinessName,
                BusinessAddress = profile.BusinessAddress,
                PhoneNumber = profile.PhoneNumber,
                VatNumber = profile.VatNumber,
                AccountNumber = profile.AccountNumber,
                BankName = profile.BankName,
                BranchCode = profile.BranchCode,
                AccountHolderName = profile.AccountHolderName,
                BusinessEmail = profile.BusinessEmail,
                LogoUrl = profile.LogoUrl,
                InvoicePrefix = profile.InvoicePrefix,
                InvoiceNumberCounter = profile.InvoiceNumberCounter,
                Currency = profile.Currency,
                CreatedAt = profile.CreatedAt,
                UpdatedAt = profile.UpdatedAt
            };

            return Ok(dto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving business profile");
            return StatusCode(500, new { message = "An error occurred while retrieving the business profile" });
        }
    }

    [HttpPut("business-profile")]
    public async Task<IActionResult> UpdateBusinessProfile([FromBody] UpdateBusinessProfileDto updateDto)
    {
        try
        {
            var email = User.Identity?.Name;
            if (string.IsNullOrEmpty(email))
            {
                return Unauthorized(new { message = "User not authenticated" });
            }

            // Map DTO to entity
            var updatedProfile = new BusinessProfile
            {
                BusinessName = updateDto.BusinessName,
                BusinessAddress = updateDto.BusinessAddress,
                PhoneNumber = updateDto.PhoneNumber,
                VatNumber = updateDto.VatNumber,
                AccountNumber = updateDto.AccountNumber,
                BankName = updateDto.BankName,
                BranchCode = updateDto.BranchCode,
                AccountHolderName = updateDto.AccountHolderName,
                BusinessEmail = updateDto.BusinessEmail,
                LogoUrl = updateDto.LogoUrl,
                Currency = updateDto.Currency
            };

            var result = await _authService.UpdateBusinessProfileAsync(email, updatedProfile);
            
            if (!result.Success)
            {
                return BadRequest(new { message = result.Message });
            }

            // Get the updated profile and return as DTO
            var profile = await _authService.GetBusinessProfileByEmailAsync(email);
            if (profile != null)
            {
                var dto = new BusinessProfileDto
                {
                    Id = profile.Id,
                    UserId = profile.UserId,
                    BusinessName = profile.BusinessName,
                    BusinessAddress = profile.BusinessAddress,
                    PhoneNumber = profile.PhoneNumber,
                    VatNumber = profile.VatNumber,
                    AccountNumber = profile.AccountNumber,
                    BankName = profile.BankName,
                    BranchCode = profile.BranchCode,
                    AccountHolderName = profile.AccountHolderName,
                    BusinessEmail = profile.BusinessEmail,
                    LogoUrl = profile.LogoUrl,
                    InvoicePrefix = profile.InvoicePrefix,
                    InvoiceNumberCounter = profile.InvoiceNumberCounter,
                    Currency = profile.Currency,
                    CreatedAt = profile.CreatedAt,
                    UpdatedAt = profile.UpdatedAt
                };
                return Ok(dto);
            }

            return Ok(new { message = result.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating business profile");
            return StatusCode(500, new { message = "An error occurred while updating the business profile" });
        }
    }

    [HttpGet("next-invoice-number")]
    public async Task<IActionResult> GetNextInvoiceNumber()
    {
        try
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
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating next invoice number");
            return StatusCode(500, new { message = "An error occurred while generating the invoice number" });
        }
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