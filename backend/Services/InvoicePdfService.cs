// Services/InvoicePdfService.cs
using System;
using System.IO;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using InvoiceSystem.Models;
using InvoiceSystem.DTOs;

namespace InvoiceSystem.Services;

public class InvoicePdfService
{
    public InvoicePdfService()
    {
        // Register QuestPDF license (for community use)
        QuestPDF.Settings.License = LicenseType.Community;
    }

    public byte[] GenerateInvoicePdf(InvoiceDto invoice, BusinessProfile business, ClientDto client)
    {
        var document = Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4);
                page.Margin(40f);
                page.DefaultTextStyle(x => x.FontSize(10).FontFamily(Fonts.Arial));

                // Add a modern accent line at the very top of the page
                page.Background().AlignTop().ExtendHorizontal().Height(8f).Background(Colors.Blue.Darken2);

                // Header with Business Info
                page.Header().PaddingTop(15f).Column(header =>
                {
                    header.Item().Row(row =>
                    {
                        // Business Details on the left
                        row.RelativeItem().Column(logoCol =>
                        {
                            // --- DYNAMIC LOGO FROM SUPABASE ---
                            if (!string.IsNullOrEmpty(business.LogoUrl))
                            {
                                try
                                {
                                    // Download the image bytes from the public URL
                                    using var httpClient = new System.Net.Http.HttpClient();
                                    byte[] imageBytes = httpClient.GetByteArrayAsync(business.LogoUrl).GetAwaiter().GetResult();
                                    
                                    logoCol.Item().Width(100f).Image(imageBytes);
                                    logoCol.Item().PaddingBottom(10f);
                                }
                                catch
                                {
                                    // Silently fail and skip the logo if the download fails
                                    // This ensures the PDF still generates even if the image link is broken
                                }
                            }
                            // ----------------------------------

                            logoCol.Item().Text(business.BusinessName)
                                .FontSize(24)
                                .Bold()
                                .FontColor(Colors.Blue.Darken3);
                            
                            logoCol.Item().PaddingTop(4f).Text(business.BusinessAddress)
                                .FontColor(Colors.Grey.Darken2);
                            
                            logoCol.Item().Text($"Phone: {business.PhoneNumber} | Email: {business.BusinessEmail ?? "N/A"}")
                                .FontColor(Colors.Grey.Darken2);
                            
                            logoCol.Item().Text($"VAT: {business.VatNumber}")
                                .FontColor(Colors.Grey.Darken2);
                        });
                        
                        // Invoice details on the right
                        row.ConstantItem(200f).Column(invoiceDetails =>
                        {
                            invoiceDetails.Item().Text("INVOICE")
                                .FontSize(28)
                                .Black()
                                .FontColor(Colors.Grey.Lighten1)
                                .AlignRight();
                            
                            invoiceDetails.Item().PaddingTop(5f).Text($"# {invoice.InvoiceNumber}")
                                .FontSize(14)
                                .Bold()
                                .FontColor(Colors.Blue.Darken2)
                                .AlignRight();
                            
                            invoiceDetails.Item().PaddingTop(5f).Text($"Date: {invoice.CreatedAt:dd MMM yyyy}")
                                .AlignRight()
                                .FontColor(Colors.Grey.Darken2);
                            
                            invoiceDetails.Item().Text($"Due Date: {invoice.DueDate:dd MMM yyyy}")
                                .AlignRight()
                                .FontColor(Colors.Grey.Darken2);
                        });
                    });
                    
                    header.Item().PaddingTop(20f).BorderBottom(2f).BorderColor(Colors.Grey.Lighten2);
                });

                // Content
                page.Content().Column(content =>
                {
                    // BILL TO on the right
                    content.Item().PaddingTop(20f).Row(row =>
                    {
                        row.RelativeItem(); // Spacer on left

                        row.ConstantItem(250f).Column(clientDetails =>
                        {
                            clientDetails.Item().Text("BILL TO")
                                .FontSize(11)
                                .Bold()
                                .FontColor(Colors.Blue.Darken3)
                                .AlignRight();
                            
                            clientDetails.Item().PaddingTop(4f).Text($"{client.FirstName} {client.LastName}")
                                .Bold()
                                .AlignRight();
                            
                            clientDetails.Item().Text(client.Email)
                                .AlignRight()
                                .FontColor(Colors.Grey.Darken2);
                            
                            clientDetails.Item().Text(client.PhoneNumber)
                                .AlignRight()
                                .FontColor(Colors.Grey.Darken2);
                            
                            if (!string.IsNullOrEmpty(client.Address))
                                clientDetails.Item().Text(client.Address)
                                    .AlignRight()
                                    .FontColor(Colors.Grey.Darken2);
                        });
                    });

                    // Items Table with Multi-Date Support
                    content.Item().PaddingTop(30f).Table(table =>
                    {
                        table.ColumnsDefinition(columns =>
                        {
                            columns.RelativeColumn(2f); // Service Date
                            columns.RelativeColumn(4f); // Description
                            columns.RelativeColumn(1.5f); // Code
                            columns.RelativeColumn(1f); // Qty
                            columns.RelativeColumn(2f); // Amount
                        });

                        // Table Header
                        table.Header(header =>
                        {
                            header.Cell().Element(HeaderStyle).Text("Date");
                            header.Cell().Element(HeaderStyle).Text("Description");
                            header.Cell().Element(HeaderStyle).Text("Code");
                            header.Cell().Element(HeaderStyle).AlignCenter().Text("Qty");
                            header.Cell().Element(HeaderStyle).AlignRight().Text("Amount");

                            static IContainer HeaderStyle(IContainer container)
                            {
                                return container
                                    .Background(Colors.Blue.Darken2)
                                    .PaddingVertical(8f)
                                    .PaddingHorizontal(4f)
                                    .DefaultTextStyle(x => x.FontColor(Colors.White).FontSize(10).SemiBold());
                            }
                        });

                        // Table Rows
                        int rowIndex = 0;
                        foreach (var item in invoice.Items)
                        {
                            var backgroundColor = rowIndex % 2 == 0 ? Colors.White : Colors.Grey.Lighten4;

                            table.Cell().Element(c => RowStyle(c, backgroundColor)).Text(item.ServiceDate.ToString("dd MMM yyyy"));
                            table.Cell().Element(c => RowStyle(c, backgroundColor)).Text(item.Description);
                            table.Cell().Element(c => RowStyle(c, backgroundColor)).Text(item.Code ?? "-");
                            table.Cell().Element(c => RowStyle(c, backgroundColor)).AlignCenter().Text(item.Quantity.ToString());
                            table.Cell().Element(c => RowStyle(c, backgroundColor)).AlignRight().Text($"{item.Total:F2}");

                            rowIndex++;
                        }

                        static IContainer RowStyle(IContainer container, string bgColor)
                        {
                            return container
                                .BorderBottom(1f)
                                .BorderColor(Colors.Grey.Lighten3)
                                .Background(bgColor)
                                .PaddingVertical(8f)
                                .PaddingHorizontal(4f);
                        }
                    });

                    // TOTAL AREA
                    content.Item().PaddingTop(20f).AlignRight().Row(row =>
                    {
                        row.ConstantItem(250f).Column(rightCol =>
                        {
                            rightCol.Item().Background(Colors.Grey.Lighten4).BorderTop(3f).BorderColor(Colors.Blue.Darken2).Padding(15f).Column(totals =>
                            {
                                totals.Item().Row(innerRow => 
                                {
                                    innerRow.RelativeItem().Text("TOTAL DUE:")
                                        .FontSize(12)
                                        .Bold()
                                        .FontColor(Colors.Blue.Darken3);

                                    innerRow.RelativeItem().Text($"{invoice.Currency} {invoice.Total:F2}")
                                        .FontSize(16)
                                        .Bold()
                                        .FontColor(Colors.Blue.Darken3)
                                        .AlignRight();
                                });
                            });
                        });
                    });

                    // PAYMENT INFO & NOTES
                    content.Item().PaddingTop(60f).Row(row =>
                    {
                        row.RelativeItem(2f).PaddingRight(30f).Column(leftCol =>
                        {
                            leftCol.Item().Text("PAYMENT INFORMATION")
                                .FontSize(11)
                                .Bold()
                                .FontColor(Colors.Blue.Darken3);
                            
                            leftCol.Item().PaddingTop(5f)
                                .Background(Colors.Grey.Lighten4)
                                .BorderLeft(3f)
                                .BorderColor(Colors.Blue.Darken2)
                                .Padding(12f)
                                .Column(bankDetails =>
                                {
                                    if (!string.IsNullOrEmpty(business.BankName))
                                        bankDetails.Item().Text($"Bank: {business.BankName}").FontSize(11).Bold().FontColor(Colors.Black);
                                    
                                    if (!string.IsNullOrEmpty(business.AccountHolderName))
                                        bankDetails.Item().Text($"Account Name: {business.AccountHolderName}").FontSize(10).FontColor(Colors.Grey.Darken3);
                                        
                                    if (!string.IsNullOrEmpty(business.AccountNumber))
                                        bankDetails.Item().Text($"Account No: {business.AccountNumber}").FontSize(11).Bold().FontColor(Colors.Black);
                                    
                                    if (!string.IsNullOrEmpty(business.BranchCode))
                                        bankDetails.Item().Text($"Branch Code: {business.BranchCode}").FontSize(10).FontColor(Colors.Grey.Darken3);
                                });

                            if (!string.IsNullOrEmpty(invoice.Notes))
                            {
                                leftCol.Item().PaddingTop(20f).Text("NOTES / TERMS")
                                    .FontSize(10)
                                    .Bold()
                                    .FontColor(Colors.Grey.Darken3);
                                
                                leftCol.Item().PaddingTop(4f).Text(invoice.Notes)
                                    .Italic()
                                    .FontColor(Colors.Grey.Darken2);
                            }
                        });

                        row.RelativeItem(1f); 
                    });
                });

                // Footer
                page.Footer().PaddingTop(20f).Column(footer =>
                {
                    footer.Item().BorderTop(1f).BorderColor(Colors.Grey.Lighten2).PaddingTop(10f).Row(row =>
                    {
                        row.RelativeItem().Text("Thank you for your business!")
                            .FontSize(10)
                            .Italic()
                            .FontColor(Colors.Grey.Darken1);

                        row.ConstantItem(150f).AlignRight().Text($"Generated: {DateTime.Now:dd MMM yyyy HH:mm}")
                            .FontSize(8)
                            .FontColor(Colors.Grey.Medium);
                    });
                });
            });
        });

        return document.GeneratePdf();
    }
}