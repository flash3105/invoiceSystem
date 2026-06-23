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
    public string Code { get; set; } = string.Empty;

    [Column("quantity")]
    public int Quantity { get; set; } = 1;

    [Column("rate")]
    public decimal Rate { get; set; }

    [Column("total")]
    public decimal Total { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}