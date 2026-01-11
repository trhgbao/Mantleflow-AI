using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Threading.Tasks;
using BE.Enums;

namespace BE.Models
{
    public class RiskAssessment
    {
        public int Id { get; set; }

        public int FinancialDocumentId { get; set; }
        public virtual FinancialDocument FinancialDocument { get; set; }

        public RiskTier Tier { get; set; } // A, B, C, D
        public double Score { get; set; } // 0-100

        public double ApprovedLtv { get; set; } // Loan-to-Value (Ví dụ: 70%)
        public double InterestRate { get; set; } // Lãi suất đề xuất

        // AI giải thích lý do (Quan trọng cho Demo)
        // VD: "Người dùng có thu nhập ổn định 20tr/tháng, công ty Top 500"
        [Column(TypeName = "jsonb")]
        public string AiReasoning { get; set; }

        public DateTime AssessedAt { get; set; } = DateTime.UtcNow;
    }
}