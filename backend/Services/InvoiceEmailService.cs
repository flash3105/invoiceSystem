// Services/InvoiceEmailService.cs
using InvoiceSystem.DTOs;
using System;
using System.Text;

namespace InvoiceSystem.Services
{
    public class InvoiceEmailService
    {
        public string GenerateInvoiceEmailHtml(InvoiceDto invoice, string businessName, string businessAddress)
        {
            var sb = new StringBuilder();

            sb.AppendLine("<!DOCTYPE html>");
            sb.AppendLine("<html>");
            sb.AppendLine("<head>");
            sb.AppendLine("<style>");
            sb.AppendLine(@"
                body { font-family: Arial, sans-serif; color: #333; line-height: 1.6; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: #1a3a5c; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
                .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }
                .invoice-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
                .amount { font-size: 24px; color: #1a3a5c; font-weight: bold; }
                .button { background: #1a3a5c; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; }
                .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
                .status-badge { 
                    display: inline-block; 
                    padding: 4px 12px; 
                    border-radius: 20px; 
                    font-size: 12px; 
                    font-weight: 600;
                    background: #d4edda;
                    color: #155724;
                }
                .details-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
            ");
            sb.AppendLine("</style>");
            sb.AppendLine("</head>");
            sb.AppendLine("<body>");
            sb.AppendLine("<div class='container'>");

            // Header
            sb.AppendLine("<div class='header'>");
            sb.AppendLine($"<h1>Invoice #{invoice.InvoiceNumber}</h1>");
            sb.AppendLine("</div>");

            // Content
            sb.AppendLine("<div class='content'>");

            // Greeting
            sb.AppendLine($"<p>Dear {invoice.ClientName},</p>");
            sb.AppendLine($"<p>Thank you for your business. Please find your invoice details below.</p>");

            // Invoice Details - FIX: Directly use DateTime objects with ToString()
            sb.AppendLine("<div class='invoice-details'>");
            sb.AppendLine($"<p><strong>Invoice Number:</strong> {invoice.InvoiceNumber}</p>");
            sb.AppendLine($"<p><strong>Date:</strong> {invoice.CreatedAt.ToString("dd MMM yyyy")}</p>");
            sb.AppendLine($"<p><strong>Service Date:</strong> {invoice.ServiceDate.ToString("dd MMM yyyy")}</p>");
            sb.AppendLine($"<p><strong>Due Date:</strong> {invoice.DueDate.ToString("dd MMM yyyy")}</p>");
            sb.AppendLine($"<p><strong>Procedure:</strong> {invoice.ProcedureType}</p>");
            sb.AppendLine($"<p><strong>Procedure Code:</strong> {invoice.ProcedureCode}</p>");
            
            // Items
            sb.AppendLine("<div style='margin: 15px 0;'>");
            sb.AppendLine("<h4>Items</h4>");
            sb.AppendLine("<table style='width:100%; border-collapse: collapse;'>");
            sb.AppendLine("<tr style='background: #f1f3f5;'>");
            sb.AppendLine("<th style='padding: 8px; text-align: left;'>Description</th>");
            sb.AppendLine("<th style='padding: 8px; text-align: right;'>Qty</th>");
            sb.AppendLine("<th style='padding: 8px; text-align: right;'>Rate</th>");
            sb.AppendLine("<th style='padding: 8px; text-align: right;'>Total</th>");
            sb.AppendLine("</tr>");

            foreach (var item in invoice.Items)
            {
                sb.AppendLine("<tr>");
                sb.AppendLine($"<td style='padding: 8px;'>{item.Description}</td>");
                sb.AppendLine($"<td style='padding: 8px; text-align: right;'>{item.Quantity}</td>");
                sb.AppendLine($"<td style='padding: 8px; text-align: right;'>R{item.Rate:F2}</td>");
                sb.AppendLine($"<td style='padding: 8px; text-align: right;'>R{item.Total:F2}</td>");
                sb.AppendLine("</tr>");
            }

            sb.AppendLine("</table>");
            sb.AppendLine("</div>");

            // Totals
            sb.AppendLine("<div style='text-align: right;'>");
            sb.AppendLine($"<p><strong>Subtotal:</strong> R{invoice.Subtotal:F2}</p>");
            sb.AppendLine($"<p><strong>Tax ({invoice.TaxRate}%):</strong> R{invoice.TaxAmount:F2}</p>");
            sb.AppendLine($"<p style='font-size: 24px; color: #1a3a5c; font-weight: bold;'>Total: R{invoice.Total:F2}</p>");
            sb.AppendLine("</div>");

            // Status
            sb.AppendLine($"<p><strong>Status:</strong> <span class='status-badge'>{invoice.Status}</span></p>");

            sb.AppendLine("</div>");

            // Notes
            if (!string.IsNullOrEmpty(invoice.Notes))
            {
                sb.AppendLine($"<p><strong>Notes:</strong> {invoice.Notes}</p>");
            }

            // Business Info
            sb.AppendLine($"<p style='margin-top: 20px;'>If you have any questions, please contact us at <strong>{businessName}</strong>.</p>");
            sb.AppendLine($"<p style='color: #666;'>{businessAddress}</p>");

            // Buttons
            sb.AppendLine("<div style='text-align: center; margin: 30px 0;'>");
            sb.AppendLine($"<a href='#' class='button'>View Invoice Online</a>");
            sb.AppendLine("</div>");

            // Footer
            sb.AppendLine("</div>");
            sb.AppendLine("<div class='footer'>");
            sb.AppendLine("<p>This invoice was generated automatically. Please do not reply to this email.</p>");
            sb.AppendLine($"<p>&copy; {DateTime.Now.Year} {businessName}. All rights reserved.</p>");
            sb.AppendLine("</div>");

            sb.AppendLine("</div>");
            sb.AppendLine("</body>");
            sb.AppendLine("</html>");

            return sb.ToString();
        }
    }
}