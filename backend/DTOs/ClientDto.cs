namespace InvoiceSystem.DTOs;

public class ClientDto
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
    public string? Address { get; set; }
    public string? IdNumber { get; set; }
    public string? PassportNumber { get; set; }
    public string? Notes { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    
    // FullName is computed here - this is safe for frontend use
    public string FullName => $"{FirstName} {LastName}";
}

public class CreateClientRequest
{
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
    public string? Address { get; set; }
    public string? IdNumber { get; set; }
    public string? PassportNumber { get; set; }
    public string? Notes { get; set; }
}

public class UpdateClientRequest
{
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
    public string? Address { get; set; }
    public string? IdNumber { get; set; }
    public string? PassportNumber { get; set; }
    public string? Notes { get; set; }
    public bool IsActive { get; set; }
}