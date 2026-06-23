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

    public async Task<(bool Success, string? Token, string? Message)> LoginAsync(string email, string password)
    {
        try
        {
            var supabase = await SupabaseClientFactory.GetClientAsync();

            // Find user by email - Use Filter instead of Where
            var userResult = await supabase
                .From<User>()
                .Filter("email", Operator.Equals, email.ToLower())
                .Get();

            if (userResult.Models.Count == 0)
            {
                _logger.LogWarning("Login attempt with non-existent email: {Email}", email);
                return (false, null, "Invalid email or password");
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
                _logger.LogWarning("Invalid password attempt for user: {Email}", email);
                return (false, null, "Invalid email or password");
            }

            // Update last login
            user.LastLogin = DateTime.UtcNow;
            await supabase.From<User>().Update(user);

            // Generate JWT token
            var token = GenerateJwtToken(user);

            _logger.LogInformation("User logged in: {Email}", email);
            return (true, token, null);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during login for user: {Email}", email);
            return (false, null, "An error occurred during login");
        }
    }

    public async Task<(bool Success, string? Message)> RegisterUserAsync(
        string email, 
        string password, 
        string fullName,
        BusinessProfile businessProfile)
    {
        try
        {
            var supabase = await SupabaseClientFactory.GetClientAsync();

            // Check if email exists - Use Filter instead of Where
            var existingEmail = await supabase
                .From<User>()
                .Filter("email", Operator.Equals, email.ToLower())
                .Get();

            if (existingEmail.Models.Count > 0)
                return (false, "Email already registered");

            // Hash password
            var salt = GenerateSalt();
            var passwordHash = HashPassword(password, salt);

            // Create user
            var user = new User
            {
                Email = email.ToLower(),
                PasswordHash = passwordHash,
                PasswordSalt = salt,
                FullName = fullName,
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                Role = "admin"
            };

            // Insert user
            await supabase.From<User>().Insert(user);

            // Get the inserted user with ID - Use Filter instead of Where
            var insertedUser = await supabase
                .From<User>()
                .Filter("email", Operator.Equals, email.ToLower())
                .Get();

            if (insertedUser.Models.Count == 0)
                return (false, "Failed to create user");

            // Set UserId and create business profile
            businessProfile.UserId = insertedUser.Models[0].Id;
            businessProfile.CreatedAt = DateTime.UtcNow;
            businessProfile.UpdatedAt = DateTime.UtcNow;

            // Insert business profile
            await supabase.From<BusinessProfile>().Insert(businessProfile);

            _logger.LogInformation("New user registered: {Email}", email);
            return (true, "User registered successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error registering user: {Email}", email);
            return (false, "An error occurred during registration");
        }
    }

    public async Task<(bool Success, string? Message)> ChangePasswordAsync(string email, string currentPassword, string newPassword)
    {
        try
        {
            var supabase = await SupabaseClientFactory.GetClientAsync();

            // Use Filter instead of Where
            var userResult = await supabase
                .From<User>()
                .Filter("email", Operator.Equals, email.ToLower())
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

            _logger.LogInformation("Password changed for user: {Email}", email);
            return (true, "Password changed successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error changing password for user: {Email}", email);
            return (false, "An error occurred while changing password");
        }
    }

    public async Task<BusinessProfile?> GetBusinessProfileByEmailAsync(string email)
    {
        try
        {
            var supabase = await SupabaseClientFactory.GetClientAsync();

            // First get user by email - Use Filter instead of Where
            var userResult = await supabase
                .From<User>()
                .Filter("email", Operator.Equals, email.ToLower())
                .Get();

            if (userResult.Models.Count == 0)
                return null;

            var userId = userResult.Models[0].Id;

            // Then get business profile - Use Filter instead of Where
            var profileResult = await supabase
                .From<BusinessProfile>()
                .Filter("user_id", Operator.Equals, userId)
                .Get();

            return profileResult.Models.FirstOrDefault();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching business profile for email: {Email}", email);
            return null;
        }
    }

    public async Task<BusinessProfile?> GetBusinessProfileByUserIdAsync(int userId)
    {
        try
        {
            var supabase = await SupabaseClientFactory.GetClientAsync();

            // Use Filter instead of Where
            var profileResult = await supabase
                .From<BusinessProfile>()
                .Filter("user_id", Operator.Equals, userId)
                .Get();

            return profileResult.Models.FirstOrDefault();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching business profile for user ID: {UserId}", userId);
            return null;
        }
    }

    public async Task<(bool Success, string? Message)> UpdateBusinessProfileAsync(
        string email, 
        BusinessProfile updatedProfile)
    {
        try
        {
            var supabase = await SupabaseClientFactory.GetClientAsync();

            // Get user by email - Use Filter instead of Where
            var userResult = await supabase
                .From<User>()
                .Filter("email", Operator.Equals, email.ToLower())
                .Get();

            if (userResult.Models.Count == 0)
                return (false, "User not found");

            var userId = userResult.Models[0].Id;

            // Get existing business profile - Use Filter instead of Where
            var profileResult = await supabase
                .From<BusinessProfile>()
                .Filter("user_id", Operator.Equals, userId)
                .Get();

            if (profileResult.Models.Count == 0)
                return (false, "Business profile not found");

            var existingProfile = profileResult.Models[0];

            // Update fields
            existingProfile.BusinessName = updatedProfile.BusinessName;
            existingProfile.BusinessAddress = updatedProfile.BusinessAddress;
            existingProfile.PhoneNumber = updatedProfile.PhoneNumber;
            existingProfile.VatNumber = updatedProfile.VatNumber;
            existingProfile.AccountNumber = updatedProfile.AccountNumber;
            existingProfile.BankName = updatedProfile.BankName ?? existingProfile.BankName;
            existingProfile.BranchCode = updatedProfile.BranchCode ?? existingProfile.BranchCode;
            existingProfile.AccountHolderName = updatedProfile.AccountHolderName ?? existingProfile.AccountHolderName;
            existingProfile.BusinessEmail = updatedProfile.BusinessEmail ?? existingProfile.BusinessEmail;
            existingProfile.LogoUrl = updatedProfile.LogoUrl ?? existingProfile.LogoUrl;
            existingProfile.InvoicePrefix = updatedProfile.InvoicePrefix ?? existingProfile.InvoicePrefix;
            existingProfile.Currency = updatedProfile.Currency ?? existingProfile.Currency;
            existingProfile.UpdatedAt = DateTime.UtcNow;

            await supabase.From<BusinessProfile>().Update(existingProfile);

            _logger.LogInformation("Business profile updated for email: {Email}", email);
            return (true, "Business profile updated successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating business profile for email: {Email}", email);
            return (false, "An error occurred while updating business profile");
        }
    }

    public async Task<string?> GetNextInvoiceNumberAsync(int businessProfileId)
    {
        try
        {
            var supabase = await SupabaseClientFactory.GetClientAsync();

            // Get business profile - Use Filter instead of Where
            var profileResult = await supabase
                .From<BusinessProfile>()
                .Filter("id", Operator.Equals, businessProfileId)
                .Get();

            if (profileResult.Models.Count == 0)
                return null;

            var profile = profileResult.Models[0];
            
            // Increment counter
            profile.InvoiceNumberCounter += 1;
            profile.UpdatedAt = DateTime.UtcNow;
            
            // Update in database
            await supabase.From<BusinessProfile>().Update(profile);
            
            // Generate invoice number (e.g., INV-001, INV-002)
            string paddedNumber = profile.InvoiceNumberCounter.ToString("D3");
            string invoiceNumber = $"{profile.InvoicePrefix}{paddedNumber}";
            
            return invoiceNumber;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating invoice number for business: {BusinessProfileId}", businessProfileId);
            return null;
        }
    }

    public async Task<bool> ResetInvoiceCounterAsync(int businessProfileId, int newCounter = 1)
    {
        try
        {
            var supabase = await SupabaseClientFactory.GetClientAsync();

            // Use Filter instead of Where
            var profileResult = await supabase
                .From<BusinessProfile>()
                .Filter("id", Operator.Equals, businessProfileId)
                .Get();

            if (profileResult.Models.Count == 0)
                return false;

            var profile = profileResult.Models[0];
            profile.InvoiceNumberCounter = newCounter;
            profile.UpdatedAt = DateTime.UtcNow;
            
            await supabase.From<BusinessProfile>().Update(profile);
            
            _logger.LogInformation("Invoice counter reset for business: {BusinessProfileId}", businessProfileId);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error resetting invoice counter for business: {BusinessProfileId}", businessProfileId);
            return false;
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
            new Claim(ClaimTypes.Name, user.Email),
            new Claim(ClaimTypes.Email, user.Email),
            new Claim(ClaimTypes.Role, user.Role ?? "admin"),
            new Claim("UserId", user.Id.ToString()),
            new Claim("FullName", user.FullName),
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