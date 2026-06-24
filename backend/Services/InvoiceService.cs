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
    private readonly EmailService _emailService;

    public InvoiceService(
        ILogger<InvoiceService> logger,
        ClientService clientService,
        BusinessProfileService businessProfileService,
        EmailService emailService)
    {
        _logger = logger;
        _clientService = clientService;
        _businessProfileService = businessProfileService;
        _emailService = emailService;
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
            const int maxRetries = 5;

            while (retryCount < maxRetries)
            {
                try
                {
                    // Generate invoice number (this increments the counter)
                    invoiceNumber = await GenerateInvoiceNumberAsync(supabase, businessProfile.Id);
                    
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
                        Status = "Sent",
                        Notes = request.Notes,
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    };

                    // Try to insert the invoice
                    await supabase.From<Models.Invoice>().Insert(invoice);
                    
                    // Success - break out of the retry loop
                    _logger.LogInformation("Invoice created successfully with number: {InvoiceNumber}", invoiceNumber);
                    break;
                }
                catch (Exception ex) when (ex.Message.Contains("duplicate key") || ex.Message.Contains("23505"))
                {
                    retryCount++;
                    _logger.LogWarning(ex, "Duplicate invoice number detected, retrying... (Attempt {RetryCount}/{MaxRetries})", 
                        retryCount + 1, maxRetries);
                    
                    if (retryCount >= maxRetries)
                    {
                        throw new Exception($"Failed to create invoice after {maxRetries} attempts");
                    }
                    
                    // Wait a bit before retrying
                    await Task.Delay(100 * retryCount);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error creating invoice (attempt {RetryCount})", retryCount + 1);
                    throw;
                }
            }

            if (string.IsNullOrEmpty(invoiceNumber))
                throw new Exception("Failed to generate invoice number");

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

            // Get invoice
            var invoiceResult = await supabase
                .From<Models.Invoice>()
                .Where(x => x.Id == id && x.BusinessProfileId == businessProfile.Id)
                .Get();

            var invoice = invoiceResult.Models.FirstOrDefault();
            if (invoice == null)
                return null;

            // Get invoice items
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

            // Build query
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

    /// <summary>
    /// Generates the next invoice number and increments the counter atomically
    /// </summary>
    private async Task<string> GenerateInvoiceNumberAsync(Supabase.Client supabase, int businessProfileId)
    {
        // Get the business profile with the latest counter
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
        
        // Update the profile
        await supabase
            .From<BusinessProfile>()
            .Where(x => x.Id == businessProfileId)
            .Update(profile);

        // Generate invoice number
        var year = DateTime.UtcNow.Year;
        var paddedNumber = profile.InvoiceNumberCounter.ToString("D4");
        var invoiceNumber = $"{profile.InvoicePrefix}{year}-{paddedNumber}";

        _logger.LogInformation("Generated invoice number: {InvoiceNumber} (Counter: {Counter})", 
            invoiceNumber, profile.InvoiceNumberCounter);

        return invoiceNumber;
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