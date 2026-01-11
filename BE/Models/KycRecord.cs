using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Threading.Tasks;

namespace BE.Models
{
    public class KycRecord
    {
        public int Id { get; set; }

        public string UserId { get; set; }
        public virtual ApplicationUser User { get; set; }

        public string FrontImageUrl { get; set; }
        public string BackImageUrl { get; set; }
        public string SelfieImageUrl { get; set; }

        // Kết quả từ AI OCR
        public double FaceMatchScore { get; set; }

        [Column(TypeName = "jsonb")]
        public string RawOcrData { get; set; } // JSON thô từ CCCD

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}