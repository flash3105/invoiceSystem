using Supabase;
using InvoiceSystem.Models;
using InvoiceSystem.DTOs;
using InvoiceSystem.Helpers;
using static Supabase.Postgrest.Constants;

namespace InvoiceSystem.Services;

public class InvoiceService
{
    private readonly ILogger<InvoiceService> _logger;
    private readonly ClientService _clientService;
    private readonly BusinessProfileService _businessProfileService;

    public InvoiceService(
        ILogger<InvoiceService> logger,
        ClientService clientService,
        BusinessProfileService businessProfileService)
    {
        _logger = logger;
        _clientService = clientService;
        _businessProfileService = businessProfileService;
    }

    public async Task<InvoiceDto> CreateInvoiceAsync(CreateInvoiceRequest request, int userId)
    {
        try
        {
            _logger.LogInformation("=== CreateInvoiceAsync called ===");
            
            var supabase = await SupabaseClientFactory.GetClientAsync();

            // Get business profile
            var businessProfile = await _businessProfileService.GetByUserIdAsync(userId);
            if (businessProfile == null)
                throw new Exception("Business profile not found");

            // Get client
            var client = await _clientService.GetClientByIdAsync(request.ClientId, userId);
            if (client == null)
                throw new Exception("Client not found");

            // Calculate totals
            var subtotal = request.Items.Sum(i => i.Quantity * i.Rate);
            var taxAmount = subtotal * (request.TaxRate / 100);
            var total = subtotal + taxAmount;

            string invoiceNumber = null;
            int retryCount = 0;
            const int maxRetries = 3;

            while (retryCount < maxRetries)
            {
                try
                {
                    invoiceNumber = await GenerateInvoiceNumberAsync(businessProfile.Id);
                    
                    // Create invoice
                    var invoice = new Models.Invoice
                    {
                        BusinessProfileId = businessProfile.Id,
                        ClientId = request.ClientId,
                        InvoiceNumber = invoiceNumber,
                        ServiceDate = request.ServiceDate,
                        DueDate = request.DueDate,
                        ProcedureType = request.ProcedureType,
                        ProcedureCode = request.ProcedureCode,
                        Subtotal = subtotal,
                        TaxRate = request.TaxRate,
                        TaxAmount = taxAmount,
                        Total = total,
                        Currency = businessProfile.Currency ?? "ZAR",
                        Status = "Draft",
                        Notes = request.Notes,
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    };

                    // Insert invoice
                    await supabase.From<Models.Invoice>().Insert(invoice);
                    break; // Success - exit retry loop
                }
                catch (Exception ex) when (ex.Message.Contains("duplicate key") && retryCount < maxRetries - 1)
                {
                    retryCount++;
                    _logger.LogWarning(ex, "Duplicate invoice number detected, retrying... (Attempt {RetryCount}/{MaxRetries})", 
                        retryCount + 1, maxRetries);
                    
                    await IncrementInvoiceCounterAsync(businessProfile.Id);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error creating invoice (attempt {RetryCount})", retryCount + 1);
                    throw;
                }
            }

            // Get created invoice
            var createdInvoice = await supabase
                .From<Models.Invoice>()
                .Where(x => x.InvoiceNumber == invoiceNumber && x.BusinessProfileId == businessProfile.Id)
                .Get();

            var invoiceResult = createdInvoice.Models.FirstOrDefault();
            if (invoiceResult == null)
                throw new Exception("Failed to create invoice");

            // Create invoice items
            foreach (var item in request.Items)
            {
                var invoiceItem = new Models.InvoiceItem
                {
                    InvoiceId = invoiceResult.Id,
                    Description = item.Description,
                    Code = item.Code,
                    Quantity = item.Quantity,
                    Rate = item.Rate,
                    Total = item.Quantity * item.Rate,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                await supabase.From<Models.InvoiceItem>().Insert(invoiceItem);
            }

            // Fetch the complete invoice with items
            var result = await GetInvoiceByIdAsync(invoiceResult.Id, userId);
            if (result == null)
                throw new Exception("Failed to retrieve created invoice");
                
            return result;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating invoice");
            throw;
        }
    }

    public async Task<InvoiceDto?> GetInvoiceByIdAsync(int id, int userId)
    {
        try
        {
            var supabase = await SupabaseClientFactory.GetClientAsync();

            // Get business profile for this user
            var businessProfile = await _businessProfileService.GetByUserIdAsync(userId);
            if (businessProfile == null)
                return null;

            // Get invoice - using Models.Invoice
            var invoiceResult = await supabase
                .From<Models.Invoice>()
                .Where(x => x.Id == id && x.BusinessProfileId == businessProfile.Id)
                .Get();

            var invoice = invoiceResult.Models.FirstOrDefault();
            if (invoice == null)
                return null;

            // Get invoice items - using Models.InvoiceItem
            var itemsResult = await supabase
                .From<Models.InvoiceItem>()
                .Where(x => x.InvoiceId == id)
                .Get();

            // Get client
            var client = await _clientService.GetClientByIdAsync(invoice.ClientId, userId);

            return MapToDto(invoice, itemsResult.Models, client);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching invoice: {InvoiceId}", id);
            return null;
        }
    }

    public async Task<List<InvoiceDto>> GetInvoicesAsync(int userId, string? status = null)
    {
        try
        {
            var supabase = await SupabaseClientFactory.GetClientAsync();

            // Get business profile for this user
            var businessProfile = await _businessProfileService.GetByUserIdAsync(userId);
            if (businessProfile == null)
                return new List<InvoiceDto>();

            // Build query - using Models.Invoice
            var query = supabase
                .From<Models.Invoice>()
                .Where(x => x.BusinessProfileId == businessProfile.Id)
                .Order("created_at", Ordering.Descending);

            if (!string.IsNullOrEmpty(status))
            {
                query = query.Where(x => x.Status == status);
            }

            var invoicesResult = await query.Get();
            var invoices = invoicesResult.Models;

            var result = new List<InvoiceDto>();
            foreach (var invoice in invoices)
            {
                var itemsResult = await supabase
                    .From<Models.InvoiceItem>()
                    .Where(x => x.InvoiceId == invoice.Id)
                    .Get();

                var client = await _clientService.GetClientByIdAsync(invoice.ClientId, userId);
                result.Add(MapToDto(invoice, itemsResult.Models, client));
            }

            return result;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching invoices");
            return new List<InvoiceDto>();
        }
    }


public async Task<bool> UpdateInvoiceStatusAsync(int id, string status, int userId)
{
    try
    {
        var supabase = await SupabaseClientFactory.GetClientAsync();

        var invoiceResult = await supabase
            .From<Models.Invoice>()
            .Where(x => x.Id == id)
            .Get();

        var invoice = invoiceResult.Models.FirstOrDefault();
        if (invoice == null)
            return false;

        // Check if user owns this invoice
        var businessProfile = await _businessProfileService.GetByUserIdAsync(userId);
        if (businessProfile == null || invoice.BusinessProfileId != businessProfile.Id)
            return false;

        // Validate status
        var validStatuses = new[] { "Draft", "Sent", "Pending", "PartiallyPaid", "Paid", "Overdue", "Cancelled" };
        if (!validStatuses.Contains(status))
            throw new Exception($"Invalid status: {status}");

        invoice.Status = status;
        invoice.UpdatedAt = DateTime.UtcNow;

        // Add status-specific fields
        switch (status)
        {
            case "Sent":
                invoice.SentAt = DateTime.UtcNow;
                break;
            case "Paid":
                invoice.PaidAt = DateTime.UtcNow;
                invoice.AmountPaid = invoice.Total;
                invoice.BalanceDue = 0;
                break;
            case "PartiallyPaid":
                invoice.AmountPaid = invoice.AmountPaid;
                invoice.BalanceDue = invoice.Total - invoice.AmountPaid;
                break;
            case "Overdue":
                if (invoice.DueDate > DateTime.UtcNow)
                    throw new Exception("Cannot mark as overdue - due date has not passed yet");
                break;
        }

        await supabase
            .From<Models.Invoice>()
            .Where(x => x.Id == id)
            .Update(invoice);

        _logger.LogInformation("Invoice {InvoiceId} status updated to {Status}", id, status);
        return true;
    }
    catch (Exception ex)
    {
        _logger.LogError(ex, "Error updating invoice status: {InvoiceId}", id);
        return false;
    }
}

    public List<string> GetAvailableStatuses()
    {
        return new List<string>
        {
            "Draft",
            "Sent", 
            "Pending",
            "PartiallyPaid",
            "Paid",
            "Overdue",
            "Cancelled"
        };
    }

    private async Task<string> GenerateInvoiceNumberAsync(int businessProfileId)
    {
        var supabase = await SupabaseClientFactory.GetClientAsync();

        // Get the business profile
        var profileResult = await supabase
            .From<BusinessProfile>()
            .Where(x => x.Id == businessProfileId)
            .Get();

        var profile = profileResult.Models.FirstOrDefault();
        if (profile == null)
            throw new Exception("Business profile not found");

        // Increment counter
        profile.InvoiceNumberCounter += 1;
        profile.UpdatedAt = DateTime.UtcNow;
        await supabase.From<BusinessProfile>().Update(profile);

        // Generate invoice number
        var year = DateTime.UtcNow.Year;
        var paddedNumber = profile.InvoiceNumberCounter.ToString("D4");
        return $"{profile.InvoicePrefix}{year}-{paddedNumber}";
    }

    
    private async Task IncrementInvoiceCounterAsync(int businessProfileId)
    {
        var supabase = await SupabaseClientFactory.GetClientAsync();

        // Get the business profile
        var profileResult = await supabase
            .From<BusinessProfile>()
            .Where(x => x.Id == businessProfileId)
            .Get();

        var profile = profileResult.Models.FirstOrDefault();
        if (profile == null)
            return;

        // Increment counter
        profile.InvoiceNumberCounter += 1;
        profile.UpdatedAt = DateTime.UtcNow;
        await supabase.From<BusinessProfile>().Update(profile);
    }
    

    private InvoiceDto MapToDto(Models.Invoice invoice, List<Models.InvoiceItem> items, ClientDto? client)
    {
        return new InvoiceDto
        {
            Id = invoice.Id,
            BusinessProfileId = invoice.BusinessProfileId,
            ClientId = invoice.ClientId,
            InvoiceNumber = invoice.InvoiceNumber,
            ServiceDate = invoice.ServiceDate,
            DueDate = invoice.DueDate,
            ProcedureType = invoice.ProcedureType,
            ProcedureCode = invoice.ProcedureCode,
            Subtotal = invoice.Subtotal,
            TaxRate = invoice.TaxRate,
            TaxAmount = invoice.TaxAmount,
            Total = invoice.Total,
            Currency = invoice.Currency,
            Status = invoice.Status,
            Notes = invoice.Notes,
            PdfUrl = invoice.PdfUrl,
            SentAt = invoice.SentAt,
            PaidAt = invoice.PaidAt,
            CreatedAt = invoice.CreatedAt,
            UpdatedAt = invoice.UpdatedAt,
            ClientName = client != null ? $"{client.FirstName} {client.LastName}" : "Unknown",
            ClientEmail = client?.Email ?? string.Empty,
            Items = items.Select(item => new InvoiceItemDto
            {
                Id = item.Id,
                InvoiceId = item.InvoiceId,
                Description = item.Description,
                Code = item.Code,
                Quantity = item.Quantity,
                Rate = item.Rate,
                Total = item.Total
            }).ToList()
        };
    }
}