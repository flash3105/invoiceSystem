using Supabase.Postgrest.Attributes;
using Supabase.Postgrest.Models;

namespace InvoiceSystem.Models;

[Table("business_profiles")]
public class BusinessProfile : BaseModel
{
    [PrimaryKey("id")]
    public int Id { get; set; }

    [Column("user_id")]
    public int UserId { get; set; }

    [Column("business_name")]
    public string BusinessName { get; set; } = string.Empty;

    [Column("business_address")]
    public string BusinessAddress { get; set; } = string.Empty;

    [Column("phone_number")]
    public string PhoneNumber { get; set; } = string.Empty;

    [Column("vat_number")]
    public string VatNumber { get; set; } = string.Empty;

    [Column("practice_number")]  // ← NEW: Practice Number field
    public string PracticeNumber { get; set; } = string.Empty;

    [Column("account_number")]
    public string AccountNumber { get; set; } = string.Empty;

    [Column("bank_name")]
    public string? BankName { get; set; }

    [Column("branch_code")]
    public string? BranchCode { get; set; }

    [Column("account_holder_name")]
    public string? AccountHolderName { get; set; }

    [Column("business_email")]
    public string? BusinessEmail { get; set; }

    [Column("logo_url")]
    public string? LogoUrl { get; set; }

    [Column("invoice_prefix")]
    public string InvoicePrefix { get; set; } = "INV-";

    [Column("invoice_number_counter")]
    public int InvoiceNumberCounter { get; set; } = 1;

    [Column("currency")]
    public string Currency { get; set; } = "ZAR";

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}