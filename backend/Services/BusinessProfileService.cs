using Supabase;
using InvoiceSystem.Models;
using InvoiceSystem.Helpers;
using static Supabase.Postgrest.Constants;

namespace InvoiceSystem.Services;

public class BusinessProfileService
{
    private readonly ILogger<BusinessProfileService> _logger;

    public BusinessProfileService(ILogger<BusinessProfileService> logger)
    {
        _logger = logger;
    }

    public async Task<BusinessProfile?> GetByUserIdAsync(int userId)
    {
        try
        {
            var supabase = await SupabaseClientFactory.GetClientAsync();

            var result = await supabase
                .From<BusinessProfile>()
                .Where(x => x.UserId == userId)
                .Get();

            return result.Models.FirstOrDefault();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching business profile for user: {UserId}", userId);
            return null;
        }
    }
}