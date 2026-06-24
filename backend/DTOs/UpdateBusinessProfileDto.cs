// DTOs/UpdateBusinessProfileDto.cs
namespace InvoiceSystem.Models.DTOs;

public class UpdateBusinessProfileDto
{
    public string BusinessName { get; set; } = string.Empty;
    public string BusinessAddress { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
    public string VatNumber { get; set; } = string.Empty;
    public string PracticeNumber { get; set; } = string.Empty; // ← NEW
    public string AccountNumber { get; set; } = string.Empty;
    public string? BankName { get; set; }
    public string? BranchCode { get; set; }
    public string? AccountHolderName { get; set; }
    public string? BusinessEmail { get; set; }
    public string? LogoUrl { get; set; }
    public string Currency { get; set; } = "ZAR";
}