// Services/InvoicePdfService.cs
using System;
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
                page.Margin(40);
                page.DefaultTextStyle(x => x.FontSize(10).FontFamily(Fonts.Arial));

                // Add a modern accent line at the very top of the page
                page.Background().AlignTop().ExtendHorizontal().Height(8).Background(Colors.Blue.Darken2);

                // Header with Business Info
                page.Header().PaddingTop(15).Column(header =>
                {
                    header.Item().Row(row =>
                    {
                        // Business Details on the left
                        row.RelativeItem().Column(logoCol =>
                        {
                            logoCol.Item().Text(business.BusinessName)
                                .FontSize(24)
                                .Bold()
                                .FontColor(Colors.Blue.Darken3);
                            
                            logoCol.Item().PaddingTop(4).Text(business.BusinessAddress)
                                .FontColor(Colors.Grey.Darken2);
                            
                            logoCol.Item().Text($"Phone: {business.PhoneNumber} | Email: {business.BusinessEmail ?? "N/A"}")
                                .FontColor(Colors.Grey.Darken2);
                            
                            logoCol.Item().Text($"VAT: {business.VatNumber}")
                                .FontColor(Colors.Grey.Darken2);
                        });
                        
                        // Invoice details on the right
                        row.ConstantItem(200).Column(invoiceDetails =>
                        {
                            invoiceDetails.Item().Text("INVOICE")
                                .FontSize(28)
                                .Black()
                                .FontColor(Colors.Grey.Lighten1)
                                .AlignRight();
                            
                            invoiceDetails.Item().PaddingTop(5).Text($"# {invoice.InvoiceNumber}")
                                .FontSize(14)
                                .Bold()
                                .FontColor(Colors.Blue.Darken2)
                                .AlignRight();
                            
                            invoiceDetails.Item().PaddingTop(5).Text($"Date: {invoice.CreatedAt:dd MMM yyyy}")
                                .AlignRight()
                                .FontColor(Colors.Grey.Darken2);
                            
                            invoiceDetails.Item().Text($"Due Date: {invoice.DueDate:dd MMM yyyy}")
                                .AlignRight()
                                .FontColor(Colors.Grey.Darken2);
                        });
                    });
                    
                    // Thicker, cleaner divider line
                    header.Item().PaddingTop(20).BorderBottom(2).BorderColor(Colors.Grey.Lighten2);
                });

                // Content
                page.Content().Column(content =>
                {
                    content.Item().PaddingTop(20).Row(row =>
                    {
                        // Procedure Details - on the left
                        row.RelativeItem().Column(procedure =>
                        {
                            procedure.Item().Text("PROCEDURE DETAILS")
                                .FontSize(11)
                                .Bold()
                                .FontColor(Colors.Blue.Darken3);
                            
                            procedure.Item().PaddingTop(4).Text($"Type: {invoice.ProcedureType}");
                            procedure.Item().Text($"Code: {invoice.ProcedureCode}");
                            procedure.Item().Text($"Service Date: {invoice.ServiceDate:dd MMM yyyy}")
                                .FontColor(Colors.Grey.Darken2);
                        });
                        
                        // BILL TO on the right
                        row.ConstantItem(220).Column(clientDetails =>
                        {
                            clientDetails.Item().Text("BILL TO")
                                .FontSize(11)
                                .Bold()
                                .FontColor(Colors.Blue.Darken3)
                                .AlignRight();
                            
                            clientDetails.Item().PaddingTop(4).Text($"{client.FirstName} {client.LastName}")
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

                    // Items Table (Qty and Rate Removed)
                    content.Item().PaddingTop(30).Table(table =>
                    {
                        table.ColumnsDefinition(columns =>
                        {
                            columns.RelativeColumn(6); // Description takes most space
                            columns.RelativeColumn(2); // Code
                            columns.RelativeColumn(3); // Amount
                        });

                        // Table Header
                        table.Header(header =>
                        {
                            header.Cell().Element(HeaderStyle).Text("Description");
                            header.Cell().Element(HeaderStyle).Text("Code");
                            header.Cell().Element(HeaderStyle).AlignRight().Text("Amount");

                            static IContainer HeaderStyle(IContainer container)
                            {
                                return container
                                    .Background(Colors.Blue.Darken2)
                                    .PaddingVertical(8)
                                    .PaddingHorizontal(4)
                                    .DefaultTextStyle(x => x.FontColor(Colors.White).FontSize(10).SemiBold());
                            }
                        });

                        // Table Rows (with Zebra Striping)
                        int rowIndex = 0;
                        foreach (var item in invoice.Items)
                        {
                            var backgroundColor = rowIndex % 2 == 0 ? Colors.White : Colors.Grey.Lighten4;

                            table.Cell().Element(c => RowStyle(c, backgroundColor)).Text(item.Description);
                            table.Cell().Element(c => RowStyle(c, backgroundColor)).Text(item.Code);
                            table.Cell().Element(c => RowStyle(c, backgroundColor)).AlignRight().Text($"{item.Total:F2}");

                            rowIndex++;
                        }

                        static IContainer RowStyle(IContainer container, string bgColor)
                        {
                            return container
                                .BorderBottom(1)
                                .BorderColor(Colors.Grey.Lighten3)
                                .Background(bgColor)
                                .PaddingVertical(8)
                                .PaddingHorizontal(4);
                        }
                    });

                    // --- 1. TOTAL AREA (Top Right) ---
                    // Renders immediately after the table
                    content.Item().PaddingTop(20).AlignRight().Row(row =>
                    {
                        row.ConstantItem(250).Column(rightCol =>
                        {
                            rightCol.Item().Background(Colors.Grey.Lighten4).BorderTop(3).BorderColor(Colors.Blue.Darken2).Padding(15).Column(totals =>
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

                    // --- 2. PAYMENT INFO & NOTES (Lower Left) ---
                    // Rendered AFTER the total area, with 100 padding to push it down visually
                    content.Item().PaddingTop(100).Row(row =>
                    {
                        // Take up roughly 2/3 of the width on the left
                        row.RelativeItem(2).PaddingRight(30).Column(leftCol =>
                        {
                            // Prominent Bank Details Box
                            leftCol.Item().Text("PAYMENT INFORMATION")
                                .FontSize(11)
                                .Bold()
                                .FontColor(Colors.Blue.Darken3);
                            
                            leftCol.Item().PaddingTop(5)
                                .Background(Colors.Grey.Lighten4)
                                .BorderLeft(3)
                                .BorderColor(Colors.Blue.Darken2)
                                .Padding(12)
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

                            // Notes underneath bank details
                            if (!string.IsNullOrEmpty(invoice.Notes))
                            {
                                leftCol.Item().PaddingTop(20).Text("NOTES / TERMS")
                                    .FontSize(10)
                                    .Bold()
                                    .FontColor(Colors.Grey.Darken3);
                                
                                leftCol.Item().PaddingTop(4).Text(invoice.Notes)
                                    .Italic()
                                    .FontColor(Colors.Grey.Darken2);
                            }
                        });

                        // Empty column on the right to keep the left side contained
                        row.RelativeItem(1); 
                    });
                });

                // Footer - Thank you message and Generation Stamp
                page.Footer().PaddingTop(20).Column(footer =>
                {
                    footer.Item().BorderTop(1).BorderColor(Colors.Grey.Lighten2).PaddingTop(10).Row(row =>
                    {
                        row.RelativeItem().Text("Thank you for your business!")
                            .FontSize(10)
                            .Italic()
                            .FontColor(Colors.Grey.Darken1);

                        row.ConstantItem(150).AlignRight().Text($"Generated: {DateTime.Now:dd MMM yyyy HH:mm}")
                            .FontSize(8)
                            .FontColor(Colors.Grey.Medium);
                    });
                });
            });
        });

        return document.GeneratePdf();
    }
}