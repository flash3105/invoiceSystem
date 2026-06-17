using Supabase;

namespace InvoiceSystem.Helpers;

public static class SupabaseClientFactory
{
    private static Supabase.Client? _client;
    private static readonly object _lock = new object();
    private static bool _isInitialized = false;

    public static async Task<Supabase.Client> GetClientAsync()
    {
        if (_client == null)
        {
            lock (_lock)
            {
                if (_client == null)
                {
                    var url = Environment.GetEnvironmentVariable("SUPABASE_URL") 
                        ?? throw new Exception("SUPABASE_URL environment variable not set");
                    
                    var key = Environment.GetEnvironmentVariable("SUPABASE_KEY") 
                        ?? throw new Exception("SUPABASE_KEY environment variable not set");

                    var options = new SupabaseOptions
                    {
                        AutoRefreshToken = true
                    };

                    _client = new Supabase.Client(url, key, options);
                }
            }
        }

        // Initialize only once
        if (!_isInitialized)
        {
            await _client.InitializeAsync();
            _isInitialized = true;
        }

        return _client;
    }
}