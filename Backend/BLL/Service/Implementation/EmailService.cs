using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.Configuration;
using MimeKit;
using MimeKit.Text;
namespace BLL.Service.Implementation
{
    public class EmailService : IEmailService
    {
        private readonly IConfiguration _config;



        public EmailService(IConfiguration config)
        {
            _config = config;
        }



        public async Task SendEmailAsync(string toEmail, string subject, string body)
        {
            var email = new MimeMessage();
            email.From.Add(MailboxAddress.Parse(_config["EmailSettings:Email"]));
            email.To.Add(MailboxAddress.Parse(toEmail));
            email.Subject = subject;
            email.Body = new TextPart(TextFormat.Html) { Text = body };



            using var smtp = new SmtpClient();
            // هنا بنربط بسيرفر SMTP (مثلاً Gmail)
            await smtp.ConnectAsync(_config["EmailSettings:Host"], 587, SecureSocketOptions.StartTls);
            await smtp.AuthenticateAsync(_config["EmailSettings:Email"], _config["EmailSettings:Password"]);
            await smtp.SendAsync(email);
            await smtp.DisconnectAsync(true);
        }
    }
}
