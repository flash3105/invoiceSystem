// Services/SupabaseStorageService.cs
using InvoiceSystem.Helpers; // Assuming this is where SupabaseClientFactory is
using Supabase.Storage;

namespace InvoiceSystem.Services;

public class SupabaseStorageService
{
    private readonly ILogger<SupabaseStorageService> _logger;

    public SupabaseStorageService(ILogger<SupabaseStorageService> logger)
    {
        _logger = logger;
    }

    public async Task<string> UploadLogoAsync(IFormFile file)
    {
        try
        {
            // Use your existing factory to get the client
            var supabase = await SupabaseClientFactory.GetClientAsync();
            
            // Create a unique file name to prevent overwrites
            var fileExtension = Path.GetExtension(file.FileName);
            var uniqueFileName = $"{Guid.NewGuid()}{fileExtension}";

            // Convert IFormFile to byte array
            using var memoryStream = new MemoryStream();
            await file.CopyToAsync(memoryStream);
            var fileBytes = memoryStream.ToArray();

            // Upload to the "logos" bucket we created in Step 1
           await supabase.Storage
                .From("logos")
                .Upload(fileBytes, uniqueFileName, new Supabase.Storage.FileOptions 
                { 
                     ContentType = file.ContentType,
                     Upsert = false
                    });

            // Get the public URL directly from Supabase
            var publicUrl = supabase.Storage.From("logos").GetPublicUrl(uniqueFileName);
            
            return publicUrl;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error uploading logo to Supabase Storage");
            throw;
        }
    }
}