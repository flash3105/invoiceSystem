// Services/InvoicePdfService.cs
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using InvoiceSystem.Models;
using InvoiceSystem.DTOs;

namespace InvoiceSystem.Services;

public class InvoicePdfService
{
    public byte[] GenerateInvoicePdf(InvoiceDto invoice, BusinessProfile business, ClientDto client)
    {
        // Register QuestPDF license (for commercial use)
        // QuestPDF.Settings.License = LicenseType.Community;
        
        var document = Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4);
                page.Margin(50);
                page.DefaultTextStyle(x => x.FontSize(11));

                // Header with Logo and Business Info
                page.Header()
                    .Column(header =>
                    {
                        header.Item().Row(row =>
                        {
                            row.RelativeItem().Column(logoCol =>
                            {
                                logoCol.Item().Text(business.BusinessName)
                                    .FontSize(20)
                                    .Bold()
                                    .FontColor(Colors.Blue.Darken3);
                                
                                logoCol.Item().Text(business.BusinessAddress);
                                logoCol.Item().Text($"Phone: {business.PhoneNumber}");
                                logoCol.Item().Text($"Email: {business.BusinessEmail ?? business.Email}");
                                logoCol.Item().Text($"VAT: {business.VatNumber}");
                            });
                        });
                    });

                // Invoice Details
                page.Content().Column(content =>
                {
                    content.Item().PaddingVertical(20).Row(row =>
                    {
                        row.RelativeItem().Column(details =>
                        {
                            details.Item().Text("INVOICE")
                                .FontSize(24)
                                .Bold()
                                .FontColor(Colors.Blue.Darken3);
                            
                            details.Item().Text($"Invoice #: {invoice.InvoiceNumber}");
                            details.Item().Text($"Date: {invoice.CreatedAt:dd MMM yyyy}");
                            details.Item().Text($"Due Date: {invoice.DueDate:dd MMM yyyy}");
                        });
                    });

                    // Client Details
                    content.Item().PaddingBottom(20).Row(row =>
                    {
                        row.RelativeItem().Column(clientDetails =>
                        {
                            clientDetails.Item().Text("BILL TO")
                                .FontSize(12)
                                .Bold();
                            
                            clientDetails.Item().Text($"{client.FirstName} {client.LastName}");
                            clientDetails.Item().Text(client.Email);
                            clientDetails.Item().Text(client.PhoneNumber);
                            
                            if (!string.IsNullOrEmpty(client.Address))
                                clientDetails.Item().Text(client.Address);
                        });
                    });

                    // Items Table
                    content.Item().Table(table =>
                    {
                        table.ColumnsDefinition(columns =>
                        {
                            columns.RelativeColumn(3);
                            columns.RelativeColumn(2);
                            columns.RelativeColumn(2);
                            columns.RelativeColumn(2);
                            columns.RelativeColumn(3);
                        });

                        // Table Header
                        table.Header(header =>
                        {
                            header.Cell().Element(CellStyle).Text("Description");
                            header.Cell().Element(CellStyle).Text("Code");
                            header.Cell().Element(CellStyle).Text("Quantity");
                            header.Cell().Element(CellStyle).Text("Rate");
                            header.Cell().Element(CellStyle).Text("Amount");

                            static IContainer CellStyle(IContainer container)
                            {
                                return container
                                    .Background(Colors.Grey.Lighten2)
                                    .Padding(8)
                                    .DefaultTextStyle(x => x.SemiBold());
                            }
                        });

                        // Table Rows
                        foreach (var item in invoice.Items)
                        {
                            table.Cell().Element(CellStyle).Text(item.Description);
                            table.Cell().Element(CellStyle).Text(item.Code);
                            table.Cell().Element(CellStyle).Text(item.Quantity);
                            table.Cell().Element(CellStyle).Text($"{item.Rate:C}");
                            table.Cell().Element(CellStyle).Text($"{item.Total:C}");

                            static IContainer CellStyle(IContainer container)
                            {
                                return container
                                    .BorderBottom(1)
                                    .BorderColor(Colors.Grey.Lighten1)
                                    .Padding(8);
                            }
                        }
                    });

                    // Totals
                    content.Item().PaddingTop(20).AlignRight().Column(totals =>
                    {
                        totals.Item().Row(row =>
                        {
                            row.ConstantItem(100).Text("Subtotal:");
                            row.RelativeItem().Text($"{invoice.Subtotal:C}");
                        });
                        
                        totals.Item().Row(row =>
                        {
                            row.ConstantItem(100).Text($"VAT ({invoice.TaxRate}%):");
                            row.RelativeItem().Text($"{invoice.TaxAmount:C}");
                        });
                        
                        totals.Item().Row(row =>
                        {
                            row.ConstantItem(100).Text("Total:")
                                .FontSize(14)
                                .Bold();
                            row.RelativeItem().Text($"{invoice.Total:C}")
                                .FontSize(14)
                                .Bold()
                                .FontColor(Colors.Blue.Darken3);
                        });
                    });
                });

                // Footer
                page.Footer().Column(footer =>
                {
                    footer.Item().BorderTop(1).BorderColor(Colors.Grey.Lighten2).PaddingTop(10);
                    footer.Item().Row(row =>
                    {
                        row.RelativeItem().Text("Thank you for your business!")
                            .FontSize(10)
                            .Italic();
                        
                        row.RelativeItem().AlignRight()
                            .Text($"Generated: {DateTime.Now:dd MMM yyyy HH:mm}")
                            .FontSize(8)
                            .FontColor(Colors.Grey.Medium);
                    });
                });
            });
        });

        return document.GeneratePdf();
    }
}