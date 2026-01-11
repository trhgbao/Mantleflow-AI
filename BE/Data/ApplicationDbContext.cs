using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using BE.Models;

namespace BE.Data;

public class ApplicationDbContext : IdentityDbContext<ApplicationUser>
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options) { }

    public DbSet<KycRecord> KycRecords { get; set; }
    public DbSet<FinancialDocument> FinancialDocuments { get; set; }
    public DbSet<RiskAssessment> RiskAssessments { get; set; }
    public DbSet<Loan> Loans { get; set; }
    public DbSet<Notification> Notifications { get; set; }

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        // Config 1-1 User <-> KycRecord
        builder.Entity<ApplicationUser>()
            .HasOne(u => u.KycRecord)
            .WithOne(k => k.User)
            .HasForeignKey<KycRecord>(k => k.UserId);

        // Config 1-1 Document <-> RiskAssessment
        builder.Entity<FinancialDocument>()
            .HasOne(d => d.RiskAssessment)
            .WithOne(r => r.FinancialDocument)
            .HasForeignKey<RiskAssessment>(r => r.FinancialDocumentId);

        // Config 1-1 Document <-> Loan (Mỗi bảng lương chỉ được vay 1 lần tại 1 thời điểm)
        builder.Entity<Loan>()
            .HasOne(l => l.FinancialDocument)
            .WithOne(d => d.Loan)
            .HasForeignKey<Loan>(l => l.FinancialDocumentId);
            
        // Config tiền tệ
        builder.Entity<Loan>().Property(l => l.PrincipalAmount).HasColumnType("decimal(18,2)");
        builder.Entity<Loan>().Property(l => l.InterestAmount).HasColumnType("decimal(18,2)");
        builder.Entity<FinancialDocument>().Property(d => d.VerifiedIncomeAmount).HasColumnType("decimal(18,2)");
    }
}
