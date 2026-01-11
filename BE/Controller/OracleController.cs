using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using BE.Data;
using BE.Services;
using Microsoft.AspNetCore.Mvc;

namespace BE.Controller
{
    [ApiController]
    [Route("api/[controller]")]
    public class OracleController : ControllerBase
    {
        private readonly IBlockchainService _blockchainService;
        private readonly ApplicationDbContext _context;

        public OracleController(IBlockchainService blockchainService, ApplicationDbContext context)
        {
            _blockchainService = blockchainService;
            _context = context;
        }

        // API 1: Giả lập Webhook nhận tiền từ Ngân hàng (VCB, Techcombank...)
        // Frontend gọi API này sau khi User bấm "Tôi đã chuyển khoản"
        [HttpPost("webhook/receive-money")]
        public async Task<IActionResult> ReceiveBankTransfer([FromBody] BankTransferRequest request)
        {
            // 3. Tìm Loan trong DB để lấy ID thật
            var loan = await _context.Loans.FindAsync(request.LoanId);
            if (loan == null) return NotFound("Không tìm thấy khoản vay trong DB.");

            if (string.IsNullOrEmpty(loan.SmartContractLoanId))
                return BadRequest("Khoản vay này chưa có ID Blockchain.");

            // Tạo bằng chứng giả
            string proofHash = "0x" + Guid.NewGuid().ToString("N") + Guid.NewGuid().ToString("N");

            try
            {
                // Parse ID thật từ Database
                int scLoanId = int.Parse(loan.SmartContractLoanId);

                // Gửi lệnh lên Blockchain Service
                var result = await _blockchainService.SubmitPaymentAsync(scLoanId, request.Amount, proofHash);

                return Ok(new
                {
                    Message = "Oracle đã xác nhận thanh toán lên Blockchain.",
                    TransactionHash = result.TransactionHash,
                    PaymentId = result.PaymentId.ToString(),
                    OriginalLoanId = request.LoanId,
                    SmartContractLoanId = scLoanId,
                    Status = "Pending Confirmation"
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new { Error = ex.Message });
            }
        }

        // API 2: Thực thi thanh toán (Sau khi đủ xác nhận - Demo thì gọi luôn sau API 1)
        [HttpPost("execute/{paymentId}")]
        public async Task<IActionResult> ExecutePayment(int paymentId)
        {
            try
            {
                var txHash = await _blockchainService.ExecutePaymentAsync(paymentId);
                return Ok(new { Message = "Đã thực thi thanh toán thành công!", TransactionHash = txHash });
            }
            catch (Exception ex)
            {
                return BadRequest(new { Error = ex.Message });
            }
        }
    }

    public class BankTransferRequest
    {
        public int LoanId { get; set; }
        public decimal Amount { get; set; }
        public string Note { get; set; } // Nội dung chuyển khoản
    }
}