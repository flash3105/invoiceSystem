using Microsoft.AspNetCore.Mvc;
using InvoiceSystem.Services;
using InvoiceSystem.DTOs;
using Microsoft.Extensions.Configuration;

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
    private readonly IConfiguration _configuration; 

    public InvoicesController(
        InvoiceService invoiceService,
        InvoicePdfService pdfService,
        ClientService clientService,
        BusinessProfileService businessProfileService,
        ILogger<InvoicesController> logger,
        IConfiguration configuration)
    {
        _invoiceService = invoiceService;
        _pdfService = pdfService;
        _clientService = clientService;
        _businessProfileService = businessProfileService;
        _logger = logger;
        _configuration = configuration;
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
            
            // Generate HTML email content
            var emailService = new InvoiceEmailService();
            var htmlContent = emailService.GenerateInvoiceEmailHtml(
                invoice, 
                business.BusinessName, 
                business.BusinessAddress
            );

            // Send email via Brevo - FIX: Use _configuration
            var brevoEmailService = new EmailService(_configuration);
            await brevoEmailService.SendInvoiceEmailWithAttachmentAsync(
                client.Email,
                $"Invoice #{invoice.InvoiceNumber} from {business.BusinessName}",
                htmlContent,
                pdfBytes
            );

            // Update invoice status to Sent if it was Draft
            if (invoice.Status == "Draft")
            {
                await _invoiceService.UpdateInvoiceStatusAsync(id, "Sent", userId.Value);
            }

            _logger.LogInformation("Invoice {InvoiceId} sent to {Email}", id, client.Email);
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

    [HttpPost("draft")]
public async Task<IActionResult> CreateDraft([FromBody] CreateDraftInvoiceRequest request)
{
    var userId = GetUserId();
    if (userId == null) return Unauthorized();

    var draft = await _invoiceService.CreateDraftInvoiceAsync(request, userId.Value);
    return CreatedAtAction(nameof(GetInvoice), new { id = draft.Id }, draft);
}

[HttpPost("{id}/issue")]
public async Task<IActionResult> IssueDraft(int id)
{
    var userId = GetUserId();
    if (userId == null) return Unauthorized();

    try
    {
        var issuedInvoice = await _invoiceService.IssueDraftInvoiceAsync(id, userId.Value);
        return Ok(issuedInvoice);
    }
    catch (Exception ex)
    {
        return BadRequest(new { message = ex.Message });
    }
}

[HttpGet("drafts")]
public async Task<IActionResult> GetDrafts()
{
    var userId = GetUserId();
    if (userId == null) return Unauthorized(new { message = "User not authenticated" });

    // Re-use your existing service method, hardcoding the "Draft" status filter
    var drafts = await _invoiceService.GetInvoicesAsync(userId.Value, "Draft");
    return Ok(drafts);
}

[HttpPut("draft/{id}")]
public async Task<IActionResult> UpdateDraft(int id, [FromBody] CreateDraftInvoiceRequest request)
{
    try
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized(new { message = "User not authenticated" });

        var updatedDraft = await _invoiceService.UpdateDraftInvoiceAsync(id, request, userId.Value);
        return Ok(updatedDraft);
    }
    catch (Exception ex)
    {
        _logger.LogError(ex, "Error updating draft invoice {DraftId}", id);
        return BadRequest(new { message = ex.Message });
    }
}

[HttpDelete("draft/{id}")]
public async Task<IActionResult> DeleteDraft(int id)
{
    try
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized(new { message = "User not authenticated" });

        var success = await _invoiceService.DeleteDraftInvoiceAsync(id, userId.Value);
        if (!success) return NotFound(new { message = "Draft not found or you do not have permission to delete it." });

        return Ok(new { message = "Draft deleted successfully." });
    }
    catch (Exception ex)
    {
        _logger.LogError(ex, "Error deleting draft invoice {DraftId}", id);
        return BadRequest(new { message = ex.Message });
    }
}

}

public class UpdateInvoiceStatusRequest
{
    public string Status { get; set; } = string.Empty;
}