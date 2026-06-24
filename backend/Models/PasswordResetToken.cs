// Models/PasswordResetToken.cs
using Supabase.Postgrest.Attributes;
using Supabase.Postgrest.Models;

namespace InvoiceSystem.Models;

[Table("password_reset_tokens")]
public class PasswordResetToken : BaseModel
{
    [PrimaryKey("id")]
    public int Id { get; set; }

    [Column("user_id")]
    public int UserId { get; set; }

    [Column("token")]
    public string Token { get; set; } = string.Empty;

    [Column("expires_at")]
    public DateTime ExpiresAt { get; set; }

    [Column("is_used")]
    public bool IsUsed { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}