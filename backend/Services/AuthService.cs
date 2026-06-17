using System.Security.Cryptography;
using System.Text;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.IdentityModel.Tokens;
using Supabase;
using InvoiceSystem.Models;
using InvoiceSystem.Helpers;
using static Supabase.Postgrest.Constants;

namespace InvoiceSystem.Services;

public class AuthService
{
    private readonly ILogger<AuthService> _logger;
    private readonly IConfiguration _configuration;

    public AuthService(ILogger<AuthService> logger, IConfiguration configuration)
    {
        _logger = logger;
        _configuration = configuration;
    }

    public async Task<(bool Success, string? Token, string? Message)> LoginAsync(string username, string password)
    {
        try
        {
            var supabase = await SupabaseClientFactory.GetClientAsync();

            // Find user by username
            var userResult = await supabase
                .From<User>()
                .Filter("username", Operator.Equals, username.ToLower())
                .Get();

            if (userResult.Models.Count == 0)
            {
                _logger.LogWarning("Login attempt with non-existent username: {Username}", username);
                return (false, null, "Invalid username or password");
            }

            var user = userResult.Models[0];

            if (!user.IsActive)
            {
                return (false, null, "Account is disabled. Please contact administrator.");
            }

            // Verify password
            var passwordHash = HashPassword(password, user.PasswordSalt);
            if (passwordHash != user.PasswordHash)
            {
                _logger.LogWarning("Invalid password attempt for user: {Username}", username);
                return (false, null, "Invalid username or password");
            }

            // Update last login
            user.LastLogin = DateTime.UtcNow;
            await supabase.From<User>().Update(user);

            // Generate JWT token
            var token = GenerateJwtToken(user);

            _logger.LogInformation("User logged in: {Username}", username);
            return (true, token, null);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during login for user: {Username}", username);
            return (false, null, "An error occurred during login");
        }
    }

    public async Task<(bool Success, string? Message)> RegisterUserAsync(string username, string email, string password, string fullName)
    {
        try
        {
            var supabase = await SupabaseClientFactory.GetClientAsync();

            // Check if username exists
            var existingUser = await supabase
                .From<User>()
                .Filter("username", Operator.Equals, username.ToLower())
                .Get();

            if (existingUser.Models.Count > 0)
                return (false, "Username already exists");

            // Check if email exists
            var existingEmail = await supabase
                .From<User>()
                .Filter("email", Operator.Equals, email.ToLower())
                .Get();

            if (existingEmail.Models.Count > 0)
                return (false, "Email already registered");

            // Hash password
            var salt = GenerateSalt();
            var passwordHash = HashPassword(password, salt);

            var user = new User
            {
                Username = username.ToLower(),
                Email = email.ToLower(),
                PasswordHash = passwordHash,
                PasswordSalt = salt,
                FullName = fullName,
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                Role = "doctor" // Default role
            };

            await supabase.From<User>().Insert(user);

            _logger.LogInformation("New user registered: {Username}", username);
            return (true, "User registered successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error registering user: {Username}", username);
            return (false, "An error occurred during registration");
        }
    }

    public async Task<(bool Success, string? Message)> ChangePasswordAsync(string username, string currentPassword, string newPassword)
    {
        try
        {
            var supabase = await SupabaseClientFactory.GetClientAsync();

            var userResult = await supabase
                .From<User>()
                .Filter("username", Operator.Equals, username.ToLower())
                .Get();

            if (userResult.Models.Count == 0)
                return (false, "User not found");

            var user = userResult.Models[0];

            // Verify current password
            var currentHash = HashPassword(currentPassword, user.PasswordSalt);
            if (currentHash != user.PasswordHash)
                return (false, "Current password is incorrect");

            // Update password
            var newSalt = GenerateSalt();
            user.PasswordHash = HashPassword(newPassword, newSalt);
            user.PasswordSalt = newSalt;
            await supabase.From<User>().Update(user);

            _logger.LogInformation("Password changed for user: {Username}", username);
            return (true, "Password changed successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error changing password for user: {Username}", username);
            return (false, "An error occurred while changing password");
        }
    }

    private string GenerateJwtToken(User user)
    {
        // Read JWT secret from environment variable (loaded from .env)
        var secretKey = Environment.GetEnvironmentVariable("SUPABASE_JWT_SECRET") 
            ?? throw new Exception("SUPABASE_JWT_SECRET environment variable not configured");
        
        var issuer = _configuration["Jwt:Issuer"] ?? "InvoiceSystem";
        var audience = _configuration["Jwt:Audience"] ?? "InvoiceSystemClient";

        var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey));
        var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Name, user.Username),
            new Claim(ClaimTypes.Email, user.Email),
            new Claim(ClaimTypes.Role, user.Role ?? "doctor"),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
        };

        var token = new JwtSecurityToken(
            issuer: issuer,
            audience: audience,
            claims: claims,
            expires: DateTime.UtcNow.AddDays(30),
            signingCredentials: credentials
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    private string GenerateSalt()
    {
        var saltBytes = new byte[32];
        using var rng = RandomNumberGenerator.Create();
        rng.GetBytes(saltBytes);
        return Convert.ToBase64String(saltBytes);
    }

    private string HashPassword(string password, string salt)
    {
        using var sha256 = SHA256.Create();
        var combined = password + salt;
        var bytes = Encoding.UTF8.GetBytes(combined);
        var hash = sha256.ComputeHash(bytes);
        return Convert.ToBase64String(hash);
    }
}