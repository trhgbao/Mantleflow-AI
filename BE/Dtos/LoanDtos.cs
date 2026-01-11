using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace BE.Dtos
{
    public class CreateLoanRequest
    {
        public int DocumentId { get; set; } // Vay dựa trên tài liệu nào
        public decimal Amount { get; set; }
    }

    public class RepaymentRequest
    {
        public string TransactionHash { get; set; }
    }
}