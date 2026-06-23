// DTOs/InvoiceDto.cs
namespace InvoiceSystem.DTOs;

public class InvoiceDto
{
    public int Id { get; set; }
    public int BusinessProfileId { get; set; }
    public int ClientId { get; set; }
    public string InvoiceNumber { get; set; } = string.Empty;
    public DateTime ServiceDate { get; set; }
    public DateTime DueDate { get; set; }
    public string ProcedureType { get; set; } = string.Empty;
    public string ProcedureCode { get; set; } = string.Empty;
    public decimal Subtotal { get; set; }
    public decimal TaxRate { get; set; }
    public decimal TaxAmount { get; set; }
    public decimal Total { get; set; }
    public string Currency { get; set; } = "ZAR";
    public string Status { get; set; } = "Draft";
    public string? Notes { get; set; }
    public string? PdfUrl { get; set; }
    public DateTime? SentAt { get; set; }
    public DateTime? PaidAt { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public List<InvoiceItemDto> Items { get; set; } = new();
    
    // Client info (for display)
    public string ClientName { get; set; } = string.Empty;
    public string ClientEmail { get; set; } = string.Empty;
}

public class InvoiceItemDto
{
    public int Id { get; set; }
    public int InvoiceId { get; set; }
    public string Description { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public int Quantity { get; set; } = 1;
    public decimal Rate { get; set; }
    public decimal Total { get; set; }
}

public class CreateInvoiceRequest
{
    public int ClientId { get; set; }
    public DateTime ServiceDate { get; set; }
    public DateTime DueDate { get; set; }
    public string ProcedureType { get; set; } = string.Empty;
    public string ProcedureCode { get; set; } = string.Empty;
    public decimal TaxRate { get; set; } = 0;
    public string? Notes { get; set; }
    public List<CreateInvoiceItemRequest> Items { get; set; } = new();
}

public class CreateInvoiceItemRequest
{
    public string Description { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public int Quantity { get; set; } = 1;
    public decimal Rate { get; set; }
}

public class UpdateInvoiceRequest
{
    public DateTime? DueDate { get; set; }
    public string? Status { get; set; }
    public string? Notes { get; set; }
}