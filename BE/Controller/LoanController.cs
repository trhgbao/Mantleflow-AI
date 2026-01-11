using System;
using System.Collections.Generic;
using System.Linq;
using System.Numerics;
using System.Threading.Tasks;
using BE.Data;
using BE.Dtos;
using BE.Enums;
using BE.Models;
using BE.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BE.Controller
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class LoanController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IBlockchainService _blockchainService;
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly IConfiguration _configuration;

        public LoanController(ApplicationDbContext context, IBlockchainService blockchainService, UserManager<ApplicationUser> userManager, IConfiguration configuration)
        {
            _context = context;
            _blockchainService = blockchainService;
            _userManager = userManager;
            _configuration = configuration;
        }

        // POST: api/loan/create
        [HttpPost("create")]
        public async Task<IActionResult> CreateLoan([FromBody] CreateLoanRequest request)
        {
            var userId = _userManager.GetUserId(User);
            var user = await _userManager.FindByIdAsync(userId);

            if (string.IsNullOrEmpty(user.WalletAddress))
                return BadRequest("Bạn chưa liên kết ví!");

            var doc = await _context.FinancialDocuments
                .FirstOrDefaultAsync(d => d.Id == request.DocumentId && d.UserId == userId);

            if (doc == null) return NotFound("Tài liệu không tồn tại.");

            decimal loanAmount = doc.VerifiedIncomeAmount > 0 ? doc.VerifiedIncomeAmount : 100;
            int riskTier = 1;
            int osintScore = 85;

            BigInteger tokenId;
            string loanTxHash;
            string realSmartContractLoanId = ""; // Biến chứa ID thật

            try
            {
                var adminAddress = _blockchainService.GetAdminAddress();

                long dueDate = DateTimeOffset.UtcNow.AddDays(30).ToUnixTimeSeconds();
                tokenId = await _blockchainService.MintInvoiceNftAsync(
                    adminAddress,
                    doc.DocumentHash,
                    dueDate,
                    loanAmount,
                    riskTier,
                    doc.DocumentHash,
                    osintScore
                );

                var lendingPoolAddress = _configuration["Blockchain:Contracts:LendingPoolAddress"];
                await _blockchainService.ApproveNftAsync(lendingPoolAddress, tokenId);

                var currencyAddress = _configuration["Blockchain:Contracts:CurrencyTokenAddress"];

                // SỬA: Lấy về cả Hash và ID thật
                var result = await _blockchainService.CreatePoolLoanAsync(tokenId, currencyAddress);
                loanTxHash = result.TransactionHash;
                realSmartContractLoanId = result.LoanId.ToString(); // Lưu ID thật (ví dụ "1", "2")
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Lỗi Blockchain: {ex.Message}");
            }

            var loan = new Loan
            {
                UserId = userId,
                FinancialDocumentId = doc.Id,
                PrincipalAmount = loanAmount,
                InterestAmount = loanAmount * 0.05m,
                DueDate = DateTime.UtcNow.AddDays(30),
                Status = LoanStatus.Pending,

                TransactionHash = loanTxHash,
                NftTokenId = tokenId.ToString(),

                // QUAN TRỌNG: Lưu ID thật vào Database
                SmartContractLoanId = realSmartContractLoanId,

                CreatedAt = DateTime.UtcNow
            };

            _context.Loans.Add(loan);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                Message = "Khoản vay đã được tạo thành công trên Blockchain!",
                LoanId = loan.Id, // ID trong DB (để gọi API activate)
                SmartContractLoanId = realSmartContractLoanId, // ID trên Blockchain (để debug)
                NftTokenId = tokenId.ToString(),
                TransactionHash = loanTxHash
            });
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetLoanDetail(int id)
        {
            var userId = _userManager.GetUserId(User);
            var loan = await _context.Loans
                .Include(l => l.FinancialDocument)
                .FirstOrDefaultAsync(l => l.Id == id && l.UserId == userId);

            if (loan == null) return NotFound("Không tìm thấy khoản vay.");

            return Ok(new
            {
                loan.Id,
                loan.PrincipalAmount,
                loan.InterestAmount,
                loan.TotalRepayment,
                loan.DueDate,
                Status = loan.Status.ToString(),
                loan.TransactionHash,
                loan.SmartContractLoanId,
                DocumentUrl = loan.FinancialDocument.FileUrl
            });
        }

        // API: Kích hoạt khoản vay (Giải ngân)
        [HttpPost("{id}/activate")]
        public async Task<IActionResult> ActivateLoan(int id)
        {
            var userId = _userManager.GetUserId(User);
            var user = await _userManager.FindByIdAsync(userId); // Lấy thông tin User để lấy ví
            var loan = await _context.Loans.FirstOrDefaultAsync(l => l.Id == id && l.UserId == userId);

            if (loan == null) return NotFound("Không tìm thấy khoản vay.");
            if (string.IsNullOrEmpty(loan.SmartContractLoanId)) return BadRequest("Lỗi dữ liệu.");

            try
            {
                int scLoanId = int.Parse(loan.SmartContractLoanId);

                // 1. Gọi Activate: Tiền từ Pool -> Ví Admin
                var txHash = await _blockchainService.ActivateLoanAsync(scLoanId);

                // 2. [MỚI] Admin chuyển tiền -> Ví User
                // Lấy địa chỉ token tiền tệ từ config
                var currencyAddress = _configuration["Blockchain:Contracts:CurrencyTokenAddress"];

                // Tính số tiền thực nhận (Gốc - Phí). Theo contract phí là 1%.
                // Để an toàn, chuyển đúng số PrincipalAmount - 1% hoặc hardcode logic giống contract.
                // Ở đây demo tôi chuyển nguyên PrincipalAmount (Admin phải chịu lỗ phí 1% thay user, hoặc bạn trừ đi)
                decimal netAmount = loan.PrincipalAmount * 0.99m; // Giả sử trừ 1% phí origination

                var transferTx = await _blockchainService.TransferTokenAsync(currencyAddress, user.WalletAddress, netAmount);

                // Update DB
                loan.Status = LoanStatus.Active;
                loan.TransactionHash = txHash; // Lưu hash activate
                await _context.SaveChangesAsync();

                return Ok(new
                {
                    Message = "Giải ngân thành công! Tiền đã được chuyển tiếp về ví User.",
                    ActivateTx = txHash,
                    TransferTx = transferTx
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new { Error = "Lỗi: " + ex.Message });
            }
        }

        [HttpPost("{id}/confirm-repayment")]
        public async Task<IActionResult> ConfirmRepayment(int id, [FromBody] RepaymentRequest request)
        {
            var loan = await _context.Loans.FindAsync(id);
            if (loan == null) return NotFound();

            loan.Status = LoanStatus.Repaid;
            loan.TransactionHash = request.TransactionHash;

            await _context.SaveChangesAsync();
            return Ok(new { Message = "Đã ghi nhận trả nợ." });
        }
    }
}