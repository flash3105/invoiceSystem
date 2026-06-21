using Supabase;
using InvoiceSystem.Models;
using InvoiceSystem.DTOs;
using InvoiceSystem.Helpers;
using static Supabase.Postgrest.Constants;

namespace InvoiceSystem.Services;

// Alias to resolve ambiguity with Supabase.Client
using ClientModel = InvoiceSystem.Models.Client;

public class ClientService
{
    private readonly ILogger<ClientService> _logger;

    public ClientService(ILogger<ClientService> logger)
    {
        _logger = logger;
    }

    public async Task<List<ClientDto>> GetClientsAsync(int userId)
    {
        try
        {
            _logger.LogInformation("=== GetClientsAsync called for userId: {UserId} ===", userId);
            
            var supabase = await SupabaseClientFactory.GetClientAsync();

            var result = await supabase
                .From<ClientModel>()
                .Where(x => x.UserId == userId && x.IsActive == true)
                .Order("created_at", Ordering.Descending)
                .Get();

            _logger.LogInformation("Found {Count} clients for userId: {UserId}", result.Models.Count, userId);

            return result.Models.Select(c => new ClientDto
            {
                Id = c.Id,
                UserId = c.UserId,
                FirstName = c.FirstName,
                LastName = c.LastName,
                Email = c.Email,
                PhoneNumber = c.PhoneNumber,
                Address = c.Address,
                IdNumber = c.IdNumber,
                PassportNumber = c.PassportNumber,
                IsActive = c.IsActive,
                CreatedAt = c.CreatedAt,
                UpdatedAt = c.UpdatedAt
            }).ToList();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching clients for user: {UserId}", userId);
            return new List<ClientDto>();
        }
    }

    public async Task<ClientDto?> GetClientByIdAsync(int id, int userId)
    {
        try
        {
            _logger.LogInformation("GetClientByIdAsync called for Id: {Id}, UserId: {UserId}", id, userId);
            
            var supabase = await SupabaseClientFactory.GetClientAsync();

            var result = await supabase
                .From<ClientModel>()
                .Where(x => x.Id == id && x.UserId == userId)
                .Get();

            var client = result.Models.FirstOrDefault();
            if (client == null) return null;

            return new ClientDto
            {
                Id = client.Id,
                UserId = client.UserId,
                FirstName = client.FirstName,
                LastName = client.LastName,
                Email = client.Email,
                PhoneNumber = client.PhoneNumber,
                Address = client.Address,
                IdNumber = client.IdNumber,
                PassportNumber = client.PassportNumber,
                IsActive = client.IsActive,
                CreatedAt = client.CreatedAt,
                UpdatedAt = client.UpdatedAt
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching client: {ClientId}", id);
            return null;
        }
    }

    public async Task<ClientDto?> GetClientByEmailAsync(string email, int userId)
    {
        try
        {
            _logger.LogInformation("GetClientByEmailAsync called for Email: {Email}, UserId: {UserId}", email, userId);
            
            var supabase = await SupabaseClientFactory.GetClientAsync();

            var result = await supabase
                .From<ClientModel>()
                .Where(x => x.Email == email.ToLower() && x.UserId == userId)
                .Get();

            var client = result.Models.FirstOrDefault();
            if (client == null) return null;

            return new ClientDto
            {
                Id = client.Id,
                UserId = client.UserId,
                FirstName = client.FirstName,
                LastName = client.LastName,
                Email = client.Email,
                PhoneNumber = client.PhoneNumber,
                Address = client.Address,
                IdNumber = client.IdNumber,
                PassportNumber = client.PassportNumber,
                IsActive = client.IsActive,
                CreatedAt = client.CreatedAt,
                UpdatedAt = client.UpdatedAt
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching client by email: {Email}", email);
            return null;
        }
    }

    public async Task<ClientDto> CreateClientAsync(CreateClientRequest request, int userId)
    {
        try
        {
            _logger.LogInformation("=== CreateClientAsync called ===");
            
            var supabase = await SupabaseClientFactory.GetClientAsync();

            var client = new ClientModel
            {
                UserId = userId,
                FirstName = request.FirstName,
                LastName = request.LastName,
                Email = request.Email.ToLower(),
                PhoneNumber = request.PhoneNumber,
                Address = request.Address,
                IdNumber = request.IdNumber,
                PassportNumber = request.PassportNumber,
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _logger.LogInformation("Inserting client with UserId: {UserId}", client.UserId);

            await supabase.From<ClientModel>().Insert(client);

            // Get the created client
            var result = await supabase
                .From<ClientModel>()
                .Where(x => x.Email == client.Email && x.UserId == client.UserId)
                .Get();

            var createdClient = result.Models.FirstOrDefault();
            
            if (createdClient == null)
            {
                _logger.LogWarning("Could not find created client");
                throw new Exception("Failed to create client");
            }
            
            _logger.LogInformation("Client created successfully with ID: {Id}", createdClient.Id);

            return new ClientDto
            {
                Id = createdClient.Id,
                UserId = createdClient.UserId,
                FirstName = createdClient.FirstName,
                LastName = createdClient.LastName,
                Email = createdClient.Email,
                PhoneNumber = createdClient.PhoneNumber,
                Address = createdClient.Address,
                IdNumber = createdClient.IdNumber,
                PassportNumber = createdClient.PassportNumber,
                IsActive = createdClient.IsActive,
                CreatedAt = createdClient.CreatedAt,
                UpdatedAt = createdClient.UpdatedAt
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating client");
            throw;
        }
    }

    public async Task<ClientDto?> UpdateClientAsync(int id, UpdateClientRequest request, int userId)
    {
        try
        {
            _logger.LogInformation("UpdateClientAsync called for Id: {Id}, UserId: {UserId}", id, userId);
            
            var supabase = await SupabaseClientFactory.GetClientAsync();

            var existing = await supabase
                .From<ClientModel>()
                .Where(x => x.Id == id && x.UserId == userId)
                .Get();

            if (existing.Models.Count == 0)
            {
                _logger.LogWarning("Client not found for update: Id={Id}, UserId={UserId}", id, userId);
                return null;
            }

            var existingClient = existing.Models[0];
            
            existingClient.FirstName = request.FirstName;
            existingClient.LastName = request.LastName;
            existingClient.Email = request.Email.ToLower();
            existingClient.PhoneNumber = request.PhoneNumber;
            existingClient.Address = request.Address;
            existingClient.IdNumber = request.IdNumber;
            existingClient.PassportNumber = request.PassportNumber;
            existingClient.IsActive = request.IsActive;
            existingClient.UpdatedAt = DateTime.UtcNow;

            await supabase.From<ClientModel>().Update(existingClient);

            _logger.LogInformation("Client updated: {Email}", existingClient.Email);

            return new ClientDto
            {
                Id = existingClient.Id,
                UserId = existingClient.UserId,
                FirstName = existingClient.FirstName,
                LastName = existingClient.LastName,
                Email = existingClient.Email,
                PhoneNumber = existingClient.PhoneNumber,
                Address = existingClient.Address,
                IdNumber = existingClient.IdNumber,
                PassportNumber = existingClient.PassportNumber,
                IsActive = existingClient.IsActive,
                CreatedAt = existingClient.CreatedAt,
                UpdatedAt = existingClient.UpdatedAt
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating client: {ClientId}", id);
            throw;
        }
    }

    public async Task<bool> DeleteClientAsync(int id, int userId)
    {
        try
        {
            _logger.LogInformation("DeleteClientAsync called for Id: {Id}, UserId: {UserId}", id, userId);
            
            var supabase = await SupabaseClientFactory.GetClientAsync();

            var client = await supabase
                .From<ClientModel>()
                .Where(x => x.Id == id && x.UserId == userId)
                .Get();

            if (client.Models.Count == 0)
            {
                _logger.LogWarning("Client not found for delete: Id={Id}, UserId={UserId}", id, userId);
                return false;
            }

            var existingClient = client.Models[0];
            existingClient.IsActive = false;
            existingClient.UpdatedAt = DateTime.UtcNow;

            await supabase.From<ClientModel>().Update(existingClient);

            _logger.LogInformation("Client soft deleted: {ClientId}", id);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting client: {ClientId}", id);
            return false;
        }
    }

    public async Task<bool> HardDeleteClientAsync(int id, int userId)
    {
        try
        {
            _logger.LogInformation("HardDeleteClientAsync called for Id: {Id}, UserId: {UserId}", id, userId);
            
            var supabase = await SupabaseClientFactory.GetClientAsync();

            var existing = await supabase
                .From<ClientModel>()
                .Where(x => x.Id == id && x.UserId == userId)
                .Get();

            if (existing.Models.Count == 0)
            {
                _logger.LogWarning("Client not found for hard delete: Id={Id}, UserId={UserId}", id, userId);
                return false;
            }

            await supabase
                .From<ClientModel>()
                .Where(x => x.Id == id && x.UserId == userId)
                .Delete();

            _logger.LogInformation("Client permanently deleted: {ClientId}", id);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error permanently deleting client: {ClientId}", id);
            return false;
        }
    }

    public async Task<List<ClientDto>> SearchClientsAsync(int userId, string searchTerm)
    {
        try
        {
            _logger.LogInformation("SearchClientsAsync called for UserId: {UserId}, SearchTerm: {SearchTerm}", userId, searchTerm);
            
            if (string.IsNullOrWhiteSpace(searchTerm))
                return await GetClientsAsync(userId);

            var supabase = await SupabaseClientFactory.GetClientAsync();

            var result = await supabase
                .From<ClientModel>()
                .Where(x => x.UserId == userId && x.IsActive == true)
                .Get();

            var clients = result.Models;
            var searchLower = searchTerm.ToLower();

            var filtered = clients
                .Where(c => 
                    c.FirstName.ToLower().Contains(searchLower) ||
                    c.LastName.ToLower().Contains(searchLower) ||
                    $"{c.FirstName} {c.LastName}".ToLower().Contains(searchLower) ||
                    c.Email.ToLower().Contains(searchLower) ||
                    c.PhoneNumber.Contains(searchTerm) ||
                    (c.IdNumber != null && c.IdNumber.Contains(searchTerm)) ||
                    (c.PassportNumber != null && c.PassportNumber.Contains(searchTerm)) ||
                    (c.Address != null && c.Address.ToLower().Contains(searchLower))
                )
                .Select(c => new ClientDto
                {
                    Id = c.Id,
                    UserId = c.UserId,
                    FirstName = c.FirstName,
                    LastName = c.LastName,
                    Email = c.Email,
                    PhoneNumber = c.PhoneNumber,
                    Address = c.Address,
                    IdNumber = c.IdNumber,
                    PassportNumber = c.PassportNumber,
                    IsActive = c.IsActive,
                    CreatedAt = c.CreatedAt,
                    UpdatedAt = c.UpdatedAt
                })
                .ToList();

            _logger.LogInformation("Search found {Count} clients", filtered.Count);
            return filtered;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error searching clients for user: {UserId}", userId);
            return new List<ClientDto>();
        }
    }
}