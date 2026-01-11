namespace BE.Enums
{
    public enum KycStatus
    {
        None = 0,       // Chưa làm gì
        Pending = 1,    // Đang chờ AI/Admin duyệt
        Verified = 2,   // Đã xác minh CCCD
        Rejected = 3    // Bị từ chối
    }

    public enum DocumentType
    {
        SalaryStatement = 0, // Bảng lương/Sao kê ngân hàng
        UtilityBill = 1,     // Hóa đơn điện/nước/internet
        LaborContract = 2    // Hợp đồng lao động
    }

    public enum LoanStatus
    {
        Pending = 0,    // Đang chờ xử lý on-chain
        Active = 1,     // Đã giải ngân, đang tính lãi
        Repaid = 2,     // Đã trả xong
        Overdue = 3,    // Quá hạn
        Defaulted = 4   // Vỡ nợ (Liquidation)
    }

    public enum RiskTier
    {
        Unassessed = 0,
        A = 1, // Lãi thấp, LTV cao (80%)
        B = 2, // Lãi trung bình, LTV 60%
        C = 3, // Lãi cao, LTV 40%
        D = 4  // Từ chối cho vay
    }
}