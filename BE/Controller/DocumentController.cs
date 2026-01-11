using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Cryptography;
using System.Threading.Tasks;
using BE.Data;
using BE.Dtos;
using BE.Enums;
using BE.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

namespace BE.Controller
{
    [ApiController]
    [Authorize] // Bắt buộc đăng nhập mới được upload
    [Route("api/[controller]")]
    public class DocumentController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly IWebHostEnvironment _environment;

        public DocumentController(ApplicationDbContext context, UserManager<ApplicationUser> userManager, IWebHostEnvironment environment)
        {
            _context = context;
            _userManager = userManager;
            _environment = environment;
        }

        [HttpPost("upload")]
        public async Task<IActionResult> UploadDocument([FromForm] UploadDocumentRequest request)
        {
            // 1. Kiểm tra User và File
            var userId = _userManager.GetUserId(User);
            if (request.File == null || request.File.Length == 0)
                return BadRequest("Vui lòng chọn file.");

            // 2. Lưu file vào thư mục wwwroot/uploads
            string rootPath = _environment.WebRootPath ?? Path.Combine(_environment.ContentRootPath, "wwwroot");
            var uploadsFolder = Path.Combine(rootPath, "uploads");
            if (!Directory.Exists(uploadsFolder)) Directory.CreateDirectory(uploadsFolder);

            // Tạo tên file ngẫu nhiên để tránh trùng
            var uniqueFileName = Guid.NewGuid().ToString() + Path.GetExtension(request.File.FileName);
            var filePath = Path.Combine(uploadsFolder, uniqueFileName);

            using (var fileStream = new FileStream(filePath, FileMode.Create))
            {
                await request.File.CopyToAsync(fileStream);
            }

            // 3. Tính SHA256 Hash của file (Quan trọng cho Blockchain)
            // Nếu sau này file bị sửa 1 byte, hash sẽ thay đổi -> Phát hiện gian lận ngay.
            string fileHash;
            using (var stream = System.IO.File.OpenRead(filePath))
            {
                using (var sha256 = SHA256.Create())
                {
                    var hashBytes = sha256.ComputeHash(stream);
                    fileHash = BitConverter.ToString(hashBytes).Replace("-", "").ToLowerInvariant();
                }
            }

            // 4. Lưu vào Database (Sử dụng Model FinancialDocument của bạn)
            var document = new FinancialDocument
            {
                UserId = userId,
                Type = request.Type,
                FileUrl = "/uploads/" + uniqueFileName, // Đường dẫn file
                DocumentHash = fileHash,
                UploadedAt = DateTime.UtcNow,

                // Các trường này chờ AI bên Python điền vào sau
                ExtractedData = "{}", // JSON rỗng
                VerifiedIncomeAmount = 0,
                Currency = "VND"
            };

            _context.FinancialDocuments.Add(document);
            await _context.SaveChangesAsync();

            // 5. (Tùy chọn) Gọi sang API Python của bạn bạn ngay tại đây
            // await CallPythonAIService(document.Id, filePath);

            return Ok(new
            {
                Message = "Upload thành công! Đang chờ AI phân tích.",
                DocumentId = document.Id,
                FileUrl = document.FileUrl
            });
        }

        // API để Frontend lấy danh sách tài liệu của User
        [HttpGet("my-documents")]
        public IActionResult GetMyDocuments()
        {
            var userId = _userManager.GetUserId(User);
            var docs = _context.FinancialDocuments
                .Where(d => d.UserId == userId)
                .Select(d => new
                {
                    d.Id,
                    d.Type,
                    d.FileUrl,
                    d.UploadedAt,
                    d.VerifiedIncomeAmount,
                    // Parse JSON ExtractedData nếu cần
                })
                .ToList();

            return Ok(docs);
        }
    }
}