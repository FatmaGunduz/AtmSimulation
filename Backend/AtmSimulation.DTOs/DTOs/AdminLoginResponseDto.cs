namespace AtmSimulation.Application.DTOs
{
    public class AdminLoginResponseDto
    {
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
        public string Token { get; set; } = string.Empty;
        public string? UserName { get; set; } = string.Empty;
    }
}
