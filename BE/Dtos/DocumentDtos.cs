using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using BE.Enums;

namespace BE.Dtos
{
    public class UploadDocumentRequest
        {
            public IFormFile File { get; set; }
            public DocumentType Type { get; set; } // Invoice (Hoá đơn) hoặc SalaryStatement (Bảng lương)
        }

    public class DocumentResponse
    {
        public int Id { get; set; }
        public string Status { get; set; }
        public decimal DetectedIncome { get; set; }
        public string RiskTier { get; set; }
        public string AiReasoning { get; set; } // Hiển thị lý do AI chấm điểm
    }
}