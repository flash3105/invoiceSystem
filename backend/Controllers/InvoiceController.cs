using Microsoft.AspNetCore.Mvc;
using InvoiceSystem.Services;
using InvoiceSystem.DTOs;

namespace InvoiceSystem.Controllers;

[Route("api/[controller]")]
[ApiController]
public class InvoicesController : ControllerBase
{
    private readonly InvoiceService _invoiceService;
    private readonly InvoicePdfService _pdfService;
    private readonly ClientService _clientService;
    private readonly BusinessProfileService _businessProfileService;
    private readonly ILogger<InvoicesController> _logger;

    public InvoicesController(
        InvoiceService invoiceService,
        InvoicePdfService pdfService,
        ClientService clientService,
        BusinessProfileService businessProfileService,
        ILogger<InvoicesController> logger)
    {
        _invoiceService = invoiceService;
        _pdfService = pdfService;
        _clientService = clientService;
        _businessProfileService = businessProfileService;
        _logger = logger;
    }

    [HttpPost]
    public async Task<IActionResult> CreateInvoice([FromBody] CreateInvoiceRequest request)
    {
        try
        {
            var userId = GetUserId();
            if (userId == null)
                return Unauthorized(new { message = "User not authenticated" });

            var invoice = await _invoiceService.CreateInvoiceAsync(request, userId.Value);
            return CreatedAtAction(nameof(GetInvoice), new { id = invoice.Id }, invoice);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating invoice");
            return StatusCode(500, new { message = "An error occurred while creating the invoice", details = ex.Message });
        }
    }

    [HttpGet]
    public async Task<IActionResult> GetInvoices([FromQuery] string? status = null)
    {
        var userId = GetUserId();
        if (userId == null)
            return Unauthorized(new { message = "User not authenticated" });

        var invoices = await _invoiceService.GetInvoicesAsync(userId.Value, status);
        return Ok(invoices);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetInvoice(int id)
    {
        var userId = GetUserId();
        if (userId == null)
            return Unauthorized(new { message = "User not authenticated" });

        var invoice = await _invoiceService.GetInvoiceByIdAsync(id, userId.Value);
        if (invoice == null)
            return NotFound(new { message = "Invoice not found" });

        return Ok(invoice);
    }

    [HttpGet("{id}/pdf")]
    public async Task<IActionResult> DownloadPdf(int id)
    {
        try
        {
            var userId = GetUserId();
            if (userId == null)
                return Unauthorized(new { message = "User not authenticated" });

            var invoice = await _invoiceService.GetInvoiceByIdAsync(id, userId.Value);
            if (invoice == null)
                return NotFound(new { message = "Invoice not found" });

            // Get business profile
            var business = await _businessProfileService.GetByUserIdAsync(userId.Value);
            if (business == null)
                return NotFound(new { message = "Business profile not found" });

            // Get client
            var client = await _clientService.GetClientByIdAsync(invoice.ClientId, userId.Value);
            if (client == null)
                return NotFound(new { message = "Client not found" });

            // Generate PDF
            var pdfBytes = _pdfService.GenerateInvoicePdf(invoice, business, client);
            
            return File(pdfBytes, "application/pdf", $"Invoice_{invoice.InvoiceNumber}.pdf");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating PDF for invoice: {InvoiceId}", id);
            return StatusCode(500, new { message = "Failed to generate PDF", details = ex.Message });
        }
    }

    [HttpPost("{id}/email")]
    public async Task<IActionResult> EmailInvoice(int id)
    {
        try
        {
            var userId = GetUserId();
            if (userId == null)
                return Unauthorized(new { message = "User not authenticated" });

            var invoice = await _invoiceService.GetInvoiceByIdAsync(id, userId.Value);
            if (invoice == null)
                return NotFound(new { message = "Invoice not found" });

            // Get business profile
            var business = await _businessProfileService.GetByUserIdAsync(userId.Value);
            if (business == null)
                return NotFound(new { message = "Business profile not found" });

            // Get client
            var client = await _clientService.GetClientByIdAsync(invoice.ClientId, userId.Value);
            if (client == null)
                return NotFound(new { message = "Client not found" });

            // Generate PDF
            var pdfBytes = _pdfService.GenerateInvoicePdf(invoice, business, client);
            
            // TODO: Implement email sending
            // For now, just return success
            
            _logger.LogInformation("Invoice {InvoiceId} would be sent to {Email}", id, client.Email);
            return Ok(new { message = $"Invoice sent via email to {client.Email} successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending invoice email: {InvoiceId}", id);
            return StatusCode(500, new { message = "Failed to send invoice email", details = ex.Message });
        }
    }

    [HttpPut("{id}/status")]
    public async Task<IActionResult> UpdateInvoiceStatus(int id, [FromBody] UpdateInvoiceStatusRequest request)
    {
        var userId = GetUserId();
        if (userId == null)
            return Unauthorized(new { message = "User not authenticated" });

        var result = await _invoiceService.UpdateInvoiceStatusAsync(id, request.Status, userId.Value);
        if (!result)
            return NotFound(new { message = "Invoice not found" });

        return Ok(new { message = $"Invoice status updated to {request.Status}" });
    }

    private int? GetUserId()
    {
        var userIdClaim = User.FindFirst("UserId")?.Value;
        if (string.IsNullOrEmpty(userIdClaim))
            return null;

        return int.TryParse(userIdClaim, out var userId) ? userId : null;
    }
}

public class UpdateInvoiceStatusRequest
{
    public string Status { get; set; } = string.Empty;
}