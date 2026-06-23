// Models/Payment.cs
using Supabase.Postgrest.Attributes;
using Supabase.Postgrest.Models;

namespace InvoiceSystem.Models;

[Table("payments")]
public class Payment : BaseModel
{
    [PrimaryKey("id")]
    public int Id { get; set; }

    [Column("invoice_id")]
    public int InvoiceId { get; set; }

    [Column("amount")]
    public decimal Amount { get; set; }

    [Column("payment_date")]
    public DateTime PaymentDate { get; set; } = DateTime.UtcNow;

    [Column("payment_method")]
    public string PaymentMethod { get; set; } = string.Empty; // Cash, Bank Transfer, Credit Card, etc.

    [Column("reference")]
    public string? Reference { get; set; }

    [Column("notes")]
    public string? Notes { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}