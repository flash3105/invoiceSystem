public class CreateDraftInvoiceRequest
{
    // Nullable - user might start a draft without picking a client
    public int? ClientId { get; set; } 
    
    // Nullable - might not know the terms yet
    public DateTime? DueDate { get; set; } 
    
    public decimal TaxRate { get; set; } = 0;
    public string? Notes { get; set; }
    
    // Can be an empty list if they are just setting up the header
    public List<DraftInvoiceItemRequest> Items { get; set; } = new(); 
}

public class DraftInvoiceItemRequest
{
    public DateTime? ServiceDate { get; set; }
    public string Description { get; set; } = string.Empty;
    public string? Code { get; set; }
    public decimal Quantity { get; set; } = 1;
    public decimal Rate { get; set; } = 0;
}