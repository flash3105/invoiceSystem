using Supabase.Postgrest.Attributes;
using Supabase.Postgrest.Models;

namespace InvoiceSystem.Models;

[Table("invoices")]
public class Invoice : BaseModel
{
    [PrimaryKey("id")]
    public int Id { get; set; }

    [Column("business_profile_id")]
    public int BusinessProfileId { get; set; }

    [Column("client_id")]
    public int ClientId { get; set; }

    [Column("invoice_number")]
    public string InvoiceNumber { get; set; } = string.Empty;

    [Column("service_date")]
    public DateTime ServiceDate { get; set; }

    [Column("due_date")]
    public DateTime DueDate { get; set; }

    [Column("procedure_type")]
    public string ProcedureType { get; set; } = string.Empty;

    [Column("procedure_code")]
    public string ProcedureCode { get; set; } = string.Empty;

    [Column("subtotal")]
    public decimal Subtotal { get; set; }

    [Column("tax_rate")]
    public decimal TaxRate { get; set; }

    [Column("tax_amount")]
    public decimal TaxAmount { get; set; }

    [Column("total")]
    public decimal Total { get; set; }

    [Column("currency")]
    public string Currency { get; set; } = "ZAR";

    [Column("status")]
    public string Status { get; set; } = "Draft";

    [Column("notes")]
    public string? Notes { get; set; }

    [Column("pdf_url")]
    public string? PdfUrl { get; set; }

    [Column("sent_at")]
    public DateTime? SentAt { get; set; }

    [Column("paid_at")]
    public DateTime? PaidAt { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}