using Microsoft.AspNetCore.Mvc;
using InvoiceSystem.Services;
using InvoiceSystem.DTOs;

namespace InvoiceSystem.Controllers;

[Route("api/[controller]")]
[ApiController]
public class ClientsController : ControllerBase
{
    private readonly ClientService _clientService;
    private readonly ILogger<ClientsController> _logger;

    public ClientsController(ClientService clientService, ILogger<ClientsController> logger)
    {
        _clientService = clientService;
        _logger = logger;
    }

    [HttpGet]
    public async Task<IActionResult> GetClients()
    {
        var userId = GetUserId();
        if (userId == null)
            return Unauthorized(new { message = "User not authenticated" });

        var clients = await _clientService.GetClientsAsync(userId.Value);
        return Ok(clients);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetClient(int id)
    {
        var userId = GetUserId();
        if (userId == null)
            return Unauthorized(new { message = "User not authenticated" });

        var client = await _clientService.GetClientByIdAsync(id, userId.Value);
        if (client == null)
            return NotFound(new { message = "Client not found" });

        return Ok(client);
    }

    [HttpGet("search")]
    public async Task<IActionResult> SearchClients([FromQuery] string q)
    {
        var userId = GetUserId();
        if (userId == null)
            return Unauthorized(new { message = "User not authenticated" });

        var clients = await _clientService.SearchClientsAsync(userId.Value, q);
        return Ok(clients);
    }

    [HttpPost]
    public async Task<IActionResult> CreateClient([FromBody] CreateClientRequest request)
    {
        try
        {
            _logger.LogInformation("=== CreateClient POST endpoint called ===");
            
            var userId = GetUserId();
            if (userId == null)
            {
                return Unauthorized(new { message = "User not authenticated" });
            }

            // Validate required fields
            if (string.IsNullOrEmpty(request.FirstName) || 
                string.IsNullOrEmpty(request.LastName) || 
                string.IsNullOrEmpty(request.Email) || 
                string.IsNullOrEmpty(request.PhoneNumber))
            {
                return BadRequest(new { 
                    message = "First name, last name, email, and phone number are required" 
                });
            }

            // Validate email format
            if (!IsValidEmail(request.Email))
            {
                return BadRequest(new { message = "Invalid email format" });
            }

            // Check if client already exists
            var existingClient = await _clientService.GetClientByEmailAsync(request.Email, userId.Value);
            if (existingClient != null)
            {
                return Conflict(new { message = "A client with this email already exists" });
            }

            var createdClient = await _clientService.CreateClientAsync(request, userId.Value);
            
            _logger.LogInformation("Client created successfully with ID: {Id}", createdClient.Id);
            return CreatedAtAction(nameof(GetClient), new { id = createdClient.Id }, createdClient);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in CreateClient endpoint");
            return StatusCode(500, new { 
                message = "An error occurred while creating the client",
                details = ex.Message
            });
        }
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateClient(int id, [FromBody] UpdateClientRequest request)
    {
        try
        {
            var userId = GetUserId();
            if (userId == null)
                return Unauthorized(new { message = "User not authenticated" });

            var updatedClient = await _clientService.UpdateClientAsync(id, request, userId.Value);
            if (updatedClient == null)
                return NotFound(new { message = "Client not found" });

            return Ok(updatedClient);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating client: {ClientId}", id);
            return StatusCode(500, new { message = "An error occurred while updating the client" });
        }
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteClient(int id)
    {
        var userId = GetUserId();
        if (userId == null)
            return Unauthorized(new { message = "User not authenticated" });

        var result = await _clientService.DeleteClientAsync(id, userId.Value);
        if (!result)
            return NotFound(new { message = "Client not found" });

        return Ok(new { message = "Client deleted successfully" });
    }

    [HttpDelete("{id}/permanent")]
    public async Task<IActionResult> HardDeleteClient(int id)
    {
        var userId = GetUserId();
        if (userId == null)
            return Unauthorized(new { message = "User not authenticated" });

        var result = await _clientService.HardDeleteClientAsync(id, userId.Value);
        if (!result)
            return NotFound(new { message = "Client not found" });

        return Ok(new { message = "Client permanently deleted" });
    }

    private int? GetUserId()
    {
        var userIdClaim = User.FindFirst("UserId")?.Value;
        if (string.IsNullOrEmpty(userIdClaim))
            return null;

        return int.TryParse(userIdClaim, out var userId) ? userId : null;
    }

    private bool IsValidEmail(string email)
    {
        try
        {
            var addr = new System.Net.Mail.MailAddress(email);
            return addr.Address == email;
        }
        catch
        {
            return false;
        }
    }
}