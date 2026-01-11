using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;
using BE.Data;
using BE.Dtos;
using BE.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using Nethereum.Signer;

namespace BE.Controller
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IConfiguration _configuration;
        private readonly UserManager<ApplicationUser> _userManager;

        public AuthController(ApplicationDbContext context, IConfiguration configuration, UserManager<ApplicationUser> userManager)
        {
            _context = context;
            _userManager = userManager;
            _configuration = configuration;
        }

        // API Đăng ký (Register)
        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterRequest request)
        {
            var userExists = await _userManager.FindByNameAsync(request.Username);
            if (userExists != null)
                return BadRequest("Tài khoản đã tồn tại!");

            var user = new ApplicationUser
            {
                UserName = request.Username,
                Email = request.Email,
                SecurityStamp = Guid.NewGuid().ToString(),
                // Nếu model chưa có field này thì bỏ qua hoặc thêm vào
                // KycStatus = BE.Enums.KycStatus.None 
            };

            // Hàm này sẽ tự động mã hóa (hash) password an toàn
            var result = await _userManager.CreateAsync(user, request.Password);

            if (!result.Succeeded)
                return BadRequest("Đăng ký thất bại! Lỗi: " + string.Join(", ", result.Errors.Select(e => e.Description)));

            return Ok("Đăng ký thành công!");
        }

        // API Đăng nhập (Login)
        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest request)
        {
            // 1. Tìm user
            var user = await _userManager.FindByNameAsync(request.Username);

            // 2. Kiểm tra password
            if (user != null && await _userManager.CheckPasswordAsync(user, request.Password))
            {
                // 3. Nếu đúng -> Tạo Token (Dùng lại hàm cũ của bạn)
                var token = GenerateJwtToken(user);
                return Ok(new
                {
                    Token = token,
                    UserId = user.Id
                });
            }

            return Unauthorized("Sai tài khoản hoặc mật khẩu!");
        }

        // API: Liên kết ví (Dành cho User đã đăng nhập)
        [Authorize] // Bắt buộc phải có Token ở Header
        [HttpPost("link-wallet")]
        public async Task<IActionResult> LinkWallet([FromBody] ConnectWalletRequest request)
        {
            // 1. Lấy thông tin User đang đăng nhập từ Token
            var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized("Không tìm thấy thông tin người dùng.");
            }

            var user = await _userManager.FindByIdAsync(userId);
            if (user == null)
            {
                return NotFound("Tài khoản không tồn tại.");
            }

            // 2. Kiểm tra xem ví này đã có ai dùng chưa (Tránh 1 ví link nhiều acc)
            // Lưu ý: Nếu user.WalletAddress == request.WalletAddress thì coi như update lại, cho qua.
            // Logic dưới đây là để chặn 1 ví dùng cho 2 người khác nhau.
            var existingWalletUser = _context.Users.FirstOrDefault(u => u.WalletAddress == request.WalletAddress && u.Id != userId);
            if (existingWalletUser != null)
            {
                return BadRequest("Ví này đã được liên kết với một tài khoản khác!");
            }

            // 3. Verify chữ ký (Quan trọng: Phải giống hệt chuỗi Frontend ký)
            var signer = new EthereumMessageSigner();
            try
            {
                // Message cố định
                string messageToSign = "Welcome to MantleFlow AI!";

                var recoveredAddress = signer.EncodeUTF8AndEcRecover(messageToSign, request.Signature);

                // So sánh địa chỉ (Case insensitive)
                if (!recoveredAddress.Equals(request.WalletAddress, StringComparison.OrdinalIgnoreCase))
                {
                    return BadRequest("Chữ ký không hợp lệ! Vui lòng ký đúng ví.");
                }
            }
            catch
            {
                return BadRequest("Lỗi định dạng chữ ký.");
            }

            // 4. Nếu mọi thứ OK -> Lưu vào DB
            user.WalletAddress = request.WalletAddress;

            var result = await _userManager.UpdateAsync(user);

            if (result.Succeeded)
            {
                return Ok(new
                {
                    Message = "Liên kết ví thành công!",
                    WalletAddress = user.WalletAddress
                });
            }
            else
            {
                return StatusCode(500, "Lỗi khi lưu vào cơ sở dữ liệu.");
            }
        }

        private string GenerateJwtToken(ApplicationUser user)
        {
            var jwtSettings = _configuration.GetSection("JwtSettings");
            var key = Encoding.ASCII.GetBytes(jwtSettings["SecretKey"]);

            // 1. Tạo danh sách Claims cơ bản
            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id),
                new Claim(JwtRegisteredClaimNames.Sub, user.Id), // Chuẩn JWT
                new Claim(ClaimTypes.Name, user.UserName ?? "")   // Thêm username để FE hiển thị
            };

            // 2. Chỉ thêm Claim ví NẾU user đã liên kết ví (Check null)
            if (!string.IsNullOrEmpty(user.WalletAddress))
            {
                claims.Add(new Claim("WalletAddress", user.WalletAddress));
            }

            // 3. Nếu user là Premium (check logic của bạn), thêm claim role
            // if (user.IsPremium) claims.Add(new Claim(ClaimTypes.Role, "Premium"));

            var tokenHandler = new JwtSecurityTokenHandler();
            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(claims),
                Expires = DateTime.UtcNow.AddDays(30),
                SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
            };

            var token = tokenHandler.CreateToken(tokenDescriptor);
            return tokenHandler.WriteToken(token);
        }
    }
}