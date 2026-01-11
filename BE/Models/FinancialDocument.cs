using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Threading.Tasks;
using BE.Enums;

namespace BE.Models
{
    public class FinancialDocument
    {
        public int Id { get; set; }

        public string UserId { get; set; }
        public virtual ApplicationUser User { get; set; }

        public DocumentType Type { get; set; }
        public string FileUrl { get; set; } // Link file PDF/Ảnh gốc
        public string DocumentHash { get; set; } // SHA256 chống sửa file

        // Dữ liệu AI trích xuất (Lương, Tên công ty, Ngày tháng...)
        [Column(TypeName = "jsonb")]
        public string ExtractedData { get; set; }

        // Giá trị được xác thực để cấp hạn mức vay
        public decimal VerifiedIncomeAmount { get; set; }
        public string Currency { get; set; } = "VND";

        public DateTime UploadedAt { get; set; } = DateTime.UtcNow;

        public virtual RiskAssessment? RiskAssessment { get; set; }
        public virtual Loan? Loan { get; set; }
    }
}