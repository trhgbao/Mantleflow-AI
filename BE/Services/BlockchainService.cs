using Nethereum.Web3;
using Nethereum.Contracts;
using Nethereum.Hex.HexTypes;
using Nethereum.RPC.Eth.DTOs;
using System.Numerics;
using BE.Models;
using Nethereum.Util;
using Nethereum.ABI.FunctionEncoding.Attributes; // Bắt buộc phải có dòng này

namespace BE.Services
{
    public interface IBlockchainService
    {
        Task<BigInteger> MintInvoiceNftAsync(string toAddress, string invoiceHash, long dueDate, decimal amount, int riskTier, string kycProofHash, int osintScore);

        Task<string> ApproveNftAsync(string toAddress, BigInteger tokenId);

        // Trả về cả Hash và LoanId thật
        Task<(string TransactionHash, BigInteger LoanId)> CreatePoolLoanAsync(BigInteger tokenId, string currencyAddress);

        Task<string> ActivateLoanAsync(int loanId);
        Task<(string TransactionHash, BigInteger PaymentId)> SubmitPaymentAsync(int loanId, decimal amount, string proofHash);
        Task<string> ExecutePaymentAsync(int paymentId);
        string GetAdminAddress();
        Task<string> TransferTokenAsync(string tokenAddress, string toAddress, decimal amount);
    }

    public class BlockchainService : IBlockchainService
    {
        private readonly Web3 _web3;
        private readonly IConfiguration _configuration;

        // Addresses & ABIs
        private readonly string _invoiceNftAddress;
        private readonly string _lendingPoolAddress;
        private readonly string _paymentOracleAddress;

        private readonly string _invoiceNftAbi;
        private readonly string _lendingPoolAbi;
        private readonly string _paymentOracleAbi;

        public BlockchainService(IConfiguration configuration, IWebHostEnvironment env)
        {
            _configuration = configuration;

            // 1. Setup Web3
            var rpcUrl = configuration["Blockchain:RpcUrl"];
            var adminPrivateKey = configuration["Blockchain:AdminPrivateKey"];
            var chainId = int.Parse(configuration["Blockchain:ChainId"]);

            var account = new Nethereum.Web3.Accounts.Account(adminPrivateKey, new BigInteger(chainId));
            _web3 = new Web3(account, rpcUrl);

            // 2. Load Addresses
            _invoiceNftAddress = configuration["Blockchain:Contracts:InvoiceNftAddress"];
            _lendingPoolAddress = configuration["Blockchain:Contracts:LendingPoolAddress"];
            _paymentOracleAddress = configuration["Blockchain:Contracts:PaymentOracleAddress"];

            // 3. Load ABIs
            string abiFolder = Path.Combine(env.ContentRootPath, "SmartContracts", "ABIs");
            _invoiceNftAbi = GetAbiFromFile(Path.Combine(abiFolder, "InvoiceNFT.json"));
            _lendingPoolAbi = GetAbiFromFile(Path.Combine(abiFolder, "LendingPool.json"));
            _paymentOracleAbi = GetAbiFromFile(Path.Combine(abiFolder, "PaymentOracle.json"));
        }

        private string GetAbiFromFile(string path)
        {
            if (!File.Exists(path)) throw new FileNotFoundException($"Missing ABI: {path}");
            var jsonContent = File.ReadAllText(path);
            using var doc = System.Text.Json.JsonDocument.Parse(jsonContent);
            if (doc.RootElement.TryGetProperty("abi", out var abiElement)) return abiElement.ToString();
            return jsonContent;
        }

        public string GetAdminAddress() => _web3.TransactionManager.Account.Address;

        public async Task<BigInteger> MintInvoiceNftAsync(string toAddress, string invoiceHash, long dueDate, decimal amount, int riskTier, string kycProofHash, int osintScore)
        {
            var contract = _web3.Eth.GetContract(_invoiceNftAbi, _invoiceNftAddress);
            var mintFunction = contract.GetFunction("mint");

            var amountInWei = Web3.Convert.ToWei(amount, UnitConversion.EthUnit.Ether);

            var gas = await mintFunction.EstimateGasAsync(
                _web3.TransactionManager.Account.Address, null, null,
                toAddress, ConvertHexStringToBytes32(invoiceHash), new BigInteger(dueDate),
                amountInWei, riskTier, ConvertHexStringToBytes32(kycProofHash), new BigInteger(osintScore)
            );

            var receipt = await mintFunction.SendTransactionAndWaitForReceiptAsync(
                _web3.TransactionManager.Account.Address, gas, null, null,
                toAddress, ConvertHexStringToBytes32(invoiceHash), new BigInteger(dueDate),
                amountInWei, riskTier, ConvertHexStringToBytes32(kycProofHash), new BigInteger(osintScore)
            );

            var eventOutput = contract.GetEvent("InvoiceMinted").DecodeAllEventsForEvent<InvoiceMintedEventDTO>(receipt.Logs);
            if (eventOutput.Count > 0)
            {
                return eventOutput[0].Event.TokenId;
            }

            throw new Exception("Transaction thành công nhưng không tìm thấy TokenId trong logs!");
        }

        public async Task<string> ApproveNftAsync(string toAddress, BigInteger tokenId)
        {
            var contract = _web3.Eth.GetContract(_invoiceNftAbi, _invoiceNftAddress);
            var approveFunc = contract.GetFunction("approve");

            var gas = await approveFunc.EstimateGasAsync(
                _web3.TransactionManager.Account.Address, null, null,
                toAddress, tokenId
            );

            var receipt = await approveFunc.SendTransactionAndWaitForReceiptAsync(
                _web3.TransactionManager.Account.Address, gas, null, null,
                toAddress, tokenId
            );
            return receipt.TransactionHash;
        }

        public async Task<(string TransactionHash, BigInteger LoanId)> CreatePoolLoanAsync(BigInteger tokenId, string currencyAddress)
        {
            var contract = _web3.Eth.GetContract(_lendingPoolAbi, _lendingPoolAddress);
            var createLoanFunc = contract.GetFunction("createLoan");

            var gas = await createLoanFunc.EstimateGasAsync(
                _web3.TransactionManager.Account.Address, null, null,
                tokenId, currencyAddress
            );

            var receipt = await createLoanFunc.SendTransactionAndWaitForReceiptAsync(
                _web3.TransactionManager.Account.Address, gas, null, null,
                tokenId, currencyAddress
            );

            // BẮT SỰ KIỆN ĐỂ LẤY LOAN ID THẬT
            var eventOutput = contract.GetEvent("LoanCreated").DecodeAllEventsForEvent<LoanCreatedEventDTO>(receipt.Logs);

            if (eventOutput.Count > 0)
            {
                return (receipt.TransactionHash, eventOutput[0].Event.LoanId);
            }

            // Fallback nếu không bắt được event (nhưng thường sẽ bắt được)
            throw new Exception("Không tìm thấy LoanId trong sự kiện LoanCreated!");
        }

        public async Task<(string TransactionHash, BigInteger PaymentId)> SubmitPaymentAsync(int loanId, decimal amount, string proofHash)
        {
            var contract = _web3.Eth.GetContract(_paymentOracleAbi, _paymentOracleAddress);
            var submitFunc = contract.GetFunction("submitPayment");

            var amountInWei = Web3.Convert.ToWei(amount);
            byte[] proofBytes = ConvertHexStringToBytes32(proofHash); //

            // --- SỬA TẠI ĐÂY: Tự động tính toán Gas thay vì điền 800000 ---
            var gasEstimate = await submitFunc.EstimateGasAsync(
                _web3.TransactionManager.Account.Address,
                null,
                null,
                new BigInteger(loanId),
                amountInWei,
                proofBytes
            );

            // Thêm một khoảng đệm 10% để đảm bảo giao dịch không bị thiếu gas giữa chừng
            var bufferedGas = new HexBigInteger(gasEstimate.Value * 11 / 10);

            var receipt = await submitFunc.SendTransactionAndWaitForReceiptAsync(
                _web3.TransactionManager.Account.Address,
                bufferedGas, // Sử dụng gas đã tính toán
                new HexBigInteger(0),
                null,
                new BigInteger(loanId),
                amountInWei,
                proofBytes
            );

            var eventOutput = contract.GetEvent("PaymentSubmitted").DecodeAllEventsForEvent<PaymentSubmittedEventDTO>(receipt.Logs);

            if (eventOutput != null && eventOutput.Count > 0)
            {
                return (receipt.TransactionHash, eventOutput[0].Event.PaymentId);
            }

            return (receipt.TransactionHash, 0);
        }

        public async Task<string> ExecutePaymentAsync(int paymentId)
        {
            var contract = _web3.Eth.GetContract(_paymentOracleAbi, _paymentOracleAddress); //
            var func = contract.GetFunction("executePayment"); //

            // 1. Tự động tính toán Gas cần thiết
            var gasEstimate = await func.EstimateGasAsync(
                _web3.TransactionManager.Account.Address, //
                null,
                null,
                paymentId
            );

            // 2. Thêm khoảng đệm 10% gas
            var bufferedGas = new HexBigInteger(gasEstimate.Value * 11 / 10);

            // 3. Gửi transaction với lượng gas đã tính toán
            var receipt = await func.SendTransactionAndWaitForReceiptAsync(
                _web3.TransactionManager.Account.Address, //
                bufferedGas,
                null,
                null,
                paymentId
            );

            return receipt.TransactionHash; //
        }

        public async Task<string> ActivateLoanAsync(int loanId)
        {
            var contract = _web3.Eth.GetContract(_lendingPoolAbi, _lendingPoolAddress);
            var activateFunc = contract.GetFunction("activateLoan");

            // ESTIMATE GAS ĐỂ TRÁNH LỖI "Intrinsic gas too low"
            var gas = await activateFunc.EstimateGasAsync(
                _web3.TransactionManager.Account.Address, null, null,
                loanId
            );

            var receipt = await activateFunc.SendTransactionAndWaitForReceiptAsync(
                    _web3.TransactionManager.Account.Address,
                    gas,
                    null, null,
                    loanId
            );

            return receipt.TransactionHash;
        }

        public async Task<string> TransferTokenAsync(string tokenAddress, string toAddress, decimal amount)
        {
            // ABI chuẩn của ERC20 Transfer
            var transferAbi = @"[{'constant':false,'inputs':[{'name':'_to','type':'address'},{'name':'_value','type':'uint256'}],'name':'transfer','outputs':[{'name':'','type':'bool'}],'payable':false,'stateMutability':'nonpayable','type':'function'}]";

            var contract = _web3.Eth.GetContract(transferAbi, tokenAddress);
            var transferFunc = contract.GetFunction("transfer");

            var amountWei = Web3.Convert.ToWei(amount, UnitConversion.EthUnit.Ether);

            // Estimate gas
            var gas = await transferFunc.EstimateGasAsync(
                _web3.TransactionManager.Account.Address, null, null,
                toAddress, amountWei
            );

            // Gửi transaction: Admin chuyển tiền cho User
            var receipt = await transferFunc.SendTransactionAndWaitForReceiptAsync(
                _web3.TransactionManager.Account.Address, gas, null, null,
                toAddress, amountWei
            );

            return receipt.TransactionHash;
        }

        private byte[] ConvertHexStringToBytes32(string hex)
        {
            if (string.IsNullOrEmpty(hex)) return new byte[32];
            if (hex.StartsWith("0x")) hex = hex.Substring(2);

            // SỬA: Đảm bảo chuỗi luôn đủ 64 ký tự trước khi chuyển sang byte array
            if (hex.Length < 64) hex = hex.PadRight(64, '0');
            if (hex.Length > 64) hex = hex.Substring(0, 64);

            return Enumerable.Range(0, hex.Length)
                             .Where(x => x % 2 == 0)
                             .Select(x => Convert.ToByte(hex.Substring(x, 2), 16))
                             .ToArray();
        }
    }

    // DTO cho InvoiceMinted
    [Event("InvoiceMinted")]
    public class InvoiceMintedEventDTO : IEventDTO
    {
        [Parameter("uint256", "tokenId", 1, true)]
        public BigInteger TokenId { get; set; }

        [Parameter("address", "creditor", 2, true)]
        public string Creditor { get; set; }
    }

    // DTO cho LoanCreated (THÊM MỚI CÁI NÀY)
    [Event("LoanCreated")]
    public class LoanCreatedEventDTO : IEventDTO
    {
        [Parameter("uint256", "loanId", 1, true)]
        public BigInteger LoanId { get; set; }

        [Parameter("uint256", "tokenId", 2, true)]
        public BigInteger TokenId { get; set; }
        [Parameter("address", "borrower", 3, true)] // <--- THÊM DÒNG NÀY (Indexed = true)
        public string Borrower { get; set; }
    }

    [Event("PaymentSubmitted")]
    public class PaymentSubmittedEventDTO : IEventDTO
    {
        [Parameter("uint256", "paymentId", 1, true)]
        public BigInteger PaymentId { get; set; }

        [Parameter("uint256", "loanId", 2, true)]
        public BigInteger LoanId { get; set; }

        // ... các param khác nếu cần
    }
}