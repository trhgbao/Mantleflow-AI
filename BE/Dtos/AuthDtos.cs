using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace BE.Dtos
{
    public class ConnectWalletRequest
    {
        public string WalletAddress { get; set; }
        public string Signature { get; set; } // Cho SIWE
    }

    public class UserProfileDto
    {
        public string WalletAddress { get; set; }
        public string KycStatus { get; set; }
        public string RiskTier { get; set; }
    }
    public class RegisterRequest
    {
        public string Username { get; set; }
        public string Password { get; set; }
        public string Email { get; set; }
    }

    public class LoginRequest
    {
        public string Username { get; set; }
        public string Password { get; set; }
    }
}