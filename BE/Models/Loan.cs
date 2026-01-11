using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using BE.Enums;

namespace BE.Models
{
    public class Loan
    {
        public int Id { get; set; }

        public string UserId { get; set; }
        public virtual ApplicationUser User { get; set; }

        public int FinancialDocumentId { get; set; } // Vay dựa trên tài liệu nào
        public virtual FinancialDocument FinancialDocument { get; set; }

        // Thông tin Blockchain
        public string? SmartContractLoanId { get; set; } // ID trên Contract
        public string? NftTokenId { get; set; } // NFT đại diện
        public string? TransactionHash { get; set; } // Hash lúc giải ngân

        // Thông tin tài chính
        public decimal PrincipalAmount { get; set; } // Tiền gốc
        public decimal InterestAmount { get; set; } // Tiền lãi dự kiến
        public decimal TotalRepayment => PrincipalAmount + InterestAmount;

        public DateTime DueDate { get; set; }
        public LoanStatus Status { get; set; } = LoanStatus.Pending;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}