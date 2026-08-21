using Supabase.Postgrest.Attributes;
using Supabase.Postgrest.Models;

namespace InvoiceSystem.Models;

[Table("invoice_items")]
public class InvoiceItem : BaseModel
{
    [PrimaryKey("id")]
    public int Id { get; set; }

    [Column("invoice_id")]
    public int InvoiceId { get; set; }

    [Column("description")]
    public string Description { get; set; } = string.Empty;

    [Column("code")]
    public string? Code { get; set; }

    // ADD THIS LINE inside InvoiceItem class:
[Column("service_date")]
public DateTime ServiceDate { get; set; }

    [Column("quantity")]
    public decimal Quantity { get; set; } = 1;

    [Column("rate")]
    public decimal Rate { get; set; }

    [Column("total")]
    public decimal Total { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}