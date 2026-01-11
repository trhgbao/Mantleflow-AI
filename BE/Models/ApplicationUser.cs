using BE.Enums;
using Microsoft.AspNetCore.Identity;

namespace BE.Models;

public class ApplicationUser : IdentityUser
{
    public string? WalletAddress { get; set; } // Định danh Web3

    // Thông tin từ CCCD (KYC)
    public string? FullName { get; set; }
    public string? CitizenId { get; set; } // Số CCCD
    public DateTime? DateOfBirth { get; set; }
    public string? Address { get; set; }

    public KycStatus KycStatus { get; set; } = KycStatus.None;
    
    // Tổng hợp điểm tín dụng
    public RiskTier CurrentRiskTier { get; set; } = RiskTier.Unassessed;
    public double TrustScore { get; set; } = 0; // Điểm nội bộ tích lũy

    // Navigation Properties
    public virtual KycRecord? KycRecord { get; set; }
    public virtual ICollection<Loan> Loans { get; set; } = new List<Loan>();
    public virtual ICollection<FinancialDocument> Documents { get; set; } = new List<FinancialDocument>();
}
