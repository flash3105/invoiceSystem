using Microsoft.AspNetCore.Mvc;
using InvoiceSystem.Services;
using InvoiceSystem.Models;
using Microsoft.Extensions.Configuration; 

namespace InvoiceSystem.Controllers;

[Route("api/[controller]")]
[ApiController]
public class AuthController : ControllerBase
{
    private readonly AuthService _authService;
    private readonly ILogger<AuthController> _logger;
    private readonly IConfiguration _configuration; 

    public AuthController(
        AuthService authService, 
        ILogger<AuthController> logger,
        IConfiguration configuration) 
    {
        _authService = authService;
        _logger = logger;
        _configuration = configuration; 
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

    [HttpPost("forgot-password")]
    public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequest request)
    {
        try
        {
            if (string.IsNullOrEmpty(request.Email))
            {
                return BadRequest(new { message = "Email is required" });
            }

            // Generate reset token
            var token = await _authService.GeneratePasswordResetTokenAsync(request.Email);
            
            if (token == null)
            {
                // Don't reveal if email exists or not for security
                return Ok(new { message = "If an account with this email exists, a reset link has been sent." });
            }

            // Get business profile to get business name
            var profile = await _authService.GetBusinessProfileByEmailAsync(request.Email);
            var businessName = profile?.BusinessName ?? "Invoice System";

            // Build reset link 
            var frontendUrl = _configuration["FrontendUrl"] ?? _configuration["FRONTEND_URL"] ?? "http://localhost:5173";
            var resetLink = $"{frontendUrl}/reset-password?token={Uri.EscapeDataString(token)}";

            // Send email with reset link 
            var emailService = new EmailService(_configuration);
            var emailContent = GenerateResetPasswordEmailHtml(businessName, resetLink);
            
            await emailService.SendInvoiceEmailAsync(
                request.Email,
                "Reset Your Password",
                emailContent
            );

            _logger.LogInformation("Password reset email sent to: {Email}", request.Email);
            return Ok(new { message = "If an account with this email exists, a reset link has been sent." });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in ForgotPassword for: {Email}", request.Email);
            return StatusCode(500, new { message = "An error occurred while processing your request" });
        }
    }

    [HttpPost("reset-password")]
    public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequest request)
    {
        try
        {
            if (string.IsNullOrEmpty(request.Token) || string.IsNullOrEmpty(request.NewPassword))
            {
                return BadRequest(new { message = "Token and new password are required" });
            }

            if (request.NewPassword.Length < 6)
            {
                return BadRequest(new { message = "Password must be at least 6 characters" });
            }

            // Validate token
            var isValid = await _authService.IsResetTokenValidAsync(request.Token);
            if (!isValid)
            {
                return BadRequest(new { message = "Invalid or expired reset token" });
            }

            // Reset password
            var result = await _authService.ResetPasswordAsync(request.Token, request.NewPassword);
            
            if (!result.Success)
            {
                return BadRequest(new { message = result.Message });
            }

            return Ok(new { message = result.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error resetting password");
            return StatusCode(500, new { message = "An error occurred while resetting your password" });
        }
    }

    [HttpGet("validate-reset-token")]
    public async Task<IActionResult> ValidateResetToken([FromQuery] string token)
    {
        try
        {
            if (string.IsNullOrEmpty(token))
            {
                return BadRequest(new { message = "Token is required" });
            }

            var isValid = await _authService.IsResetTokenValidAsync(token);
            
            if (!isValid)
            {
                return BadRequest(new { message = "Invalid or expired reset token" });
            }

            return Ok(new { valid = true });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error validating reset token");
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    private string GenerateResetPasswordEmailHtml(string businessName, string resetLink)
    {
        return $@"
<!DOCTYPE html>
<html>
<head>
    <style>
        body {{ font-family: Arial, sans-serif; color: #333; line-height: 1.6; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background: #1a3a5c; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }}
        .content {{ background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }}
        .button {{ 
            display: inline-block; 
            padding: 12px 30px; 
            background: #1a3a5c; 
            color: white; 
            text-decoration: none; 
            border-radius: 6px; 
            margin: 20px 0;
        }}
        .footer {{ text-align: center; margin-top: 20px; color: #666; font-size: 12px; }}
        .warning {{ color: #dc3545; font-size: 14px; }}
    </style>
</head>
<body>
    <div class='container'>
        <div class='header'>
            <h1>Reset Your Password</h1>
        </div>
        <div class='content'>
            <p>Hello,</p>
            <p>We received a request to reset your password for your {businessName} account.</p>
            <p>Click the button below to reset your password:</p>
            <div style='text-align: center;'>
                <a href='{resetLink}' class='button'>Reset Password</a>
            </div>
            <p class='warning'>This link will expire in 24 hours.</p>
            <p>If you didn't request this, please ignore this email.</p>
        </div>
        <div class='footer'>
            <p>&copy; {DateTime.Now.Year} {businessName}. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
        ";
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

public class ForgotPasswordRequest
{
    public string Email { get; set; } = string.Empty;
}

public class ResetPasswordRequest
{
    public string Token { get; set; } = string.Empty;
    public string NewPassword { get; set; } = string.Empty;
}