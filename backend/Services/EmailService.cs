// Services/EmailService.cs
using Microsoft.Extensions.Configuration;
using System;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;

namespace InvoiceSystem.Services
{
    public class EmailService
    {
        private readonly IConfiguration _config;
        private readonly HttpClient _httpClient;

        public EmailService(IConfiguration config, HttpClient httpClient = null)
        {
            _config = config;
            _httpClient = httpClient ?? new HttpClient();
        }

        public async Task SendInvoiceEmailAsync(string to, string subject, string htmlContent, byte[] pdfAttachment = null)
        {
            if (string.IsNullOrWhiteSpace(to) || !to.Contains("@"))
                throw new ArgumentException($"Invalid recipient email address: {to}");

            // Try multiple environment variable formats
            var apiKey = _config["Brevo:ApiKey"] ?? _config["Brevo__ApiKey"] ?? _config["BREVO_API_KEY"];
            var fromEmail = _config["Brevo:FromEmail"] ?? _config["Brevo__FromEmail"] ?? _config["BREVO_FROM_EMAIL"] ?? "noreply@invoicesystem.com";
            var fromName = _config["Brevo:FromName"] ?? _config["Brevo__FromName"] ?? _config["BREVO_FROM_NAME"] ?? "Invoice System";

            if (string.IsNullOrEmpty(apiKey))
            {
                Console.WriteLine("Brevo API Key not found. Tried:");
                Console.WriteLine($"Brevo:ApiKey: {_config["Brevo:ApiKey"] ?? "NULL"}");
                Console.WriteLine($"Brevo__ApiKey: {_config["Brevo__ApiKey"] ?? "NULL"}");
                Console.WriteLine($"BREVO_API_KEY: {_config["BREVO_API_KEY"] ?? "NULL"}");
                throw new Exception("Brevo API key is not configured. Check environment variables.");
            }

            try
            {
                var emailData = new
                {
                    sender = new { email = fromEmail, name = fromName },
                    to = new[] { new { email = to } },
                    subject = subject,
                    htmlContent = htmlContent
                };

                // Add PDF attachment if provided
                object emailPayload;
                if (pdfAttachment != null && pdfAttachment.Length > 0)
                {
                    var attachmentBase64 = Convert.ToBase64String(pdfAttachment);
                    emailPayload = new
                    {
                        sender = new { email = fromEmail, name = fromName },
                        to = new[] { new { email = to } },
                        subject = subject,
                        htmlContent = htmlContent,
                        attachment = new[]
                        {
                            new
                            {
                                content = attachmentBase64,
                                name = $"invoice.pdf"
                            }
                        }
                    };
                }
                else
                {
                    emailPayload = emailData;
                }

                var json = JsonSerializer.Serialize(emailPayload);
                var content = new StringContent(json, Encoding.UTF8, "application/json");

                _httpClient.DefaultRequestHeaders.Clear();
                _httpClient.DefaultRequestHeaders.Add("api-key", apiKey);

                var response = await _httpClient.PostAsync("https://api.brevo.com/v3/smtp/email", content);

                if (response.IsSuccessStatusCode)
                {
                    var responseContent = await response.Content.ReadAsStringAsync();
                    Console.WriteLine($"Brevo email successfully sent to {to}");
                    Console.WriteLine($"Response: {responseContent}");
                }
                else
                {
                    var errorContent = await response.Content.ReadAsStringAsync();
                    throw new Exception($"Brevo API error: {response.StatusCode} - {errorContent}");
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Brevo email sending failed: {ex.Message}");
                throw;
            }
        }

        public async Task SendInvoiceEmailWithAttachmentAsync(string to, string subject, string htmlContent, byte[] pdfAttachment)
        {
            await SendInvoiceEmailAsync(to, subject, htmlContent, pdfAttachment);
        }
    }
}