using Supabase.Postgrest.Attributes;
using Supabase.Postgrest.Models;

namespace InvoiceSystem.Models;

[Table("clients")]
public class Client : BaseModel
{
    [PrimaryKey("id")]
    public int Id { get; set; }

    [Column("user_id")]
    public int UserId { get; set; }

    [Column("first_name")]
    public string FirstName { get; set; } = string.Empty;

    [Column("last_name")]
    public string LastName { get; set; } = string.Empty;

    [Column("id_number")]
    public string? IdNumber { get; set; }

    [Column("passport_number")]
    public string? PassportNumber { get; set; }

    [Column("email")]
    public string Email { get; set; } = string.Empty;

    [Column("phone_number")]
    public string PhoneNumber { get; set; } = string.Empty;

    [Column("address")]
    public string? Address { get; set; }

    [Column("notes")]
    public string? Notes { get; set; }

    [Column("is_active")]
    public bool IsActive { get; set; } = true;

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // FullName is removed from the model
    // It will be computed in the DTO instead
}