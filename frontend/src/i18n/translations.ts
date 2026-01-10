/**
 * Hệ thống đa ngôn ngữ - Tiếng Việt & Tiếng Anh
 */

export type Language = 'vi' | 'en';

export const translations = {
  vi: {
    // Common
    common: {
      loading: 'Đang tải...',
      error: 'Có lỗi xảy ra',
      success: 'Thành công',
      cancel: 'Hủy',
      confirm: 'Xác nhận',
      save: 'Lưu',
      delete: 'Xóa',
      edit: 'Sửa',
      view: 'Xem',
      back: 'Quay lại',
      next: 'Tiếp theo',
      submit: 'Gửi',
      search: 'Tìm kiếm',
    },

    // Navigation
    nav: {
      home: 'Trang chủ',
      dashboard: 'Bảng điều khiển',
      upload: 'Tải lên chứng từ',
      loans: 'Khoản vay',
      marketplace: 'Sàn đấu giá',
      settings: 'Cài đặt',
    },

    // Document Types
    docTypes: {
      LAND_TITLE: 'Sổ đỏ / Giấy chứng nhận QSDĐ',
      VEHICLE: 'Đăng ký xe / Đăng kiểm',
      SAVINGS: 'Sổ tiết kiệm',
      BUSINESS_REG: 'Giấy chứng nhận ĐKKD',
      PATENT: 'Bằng độc quyền sáng chế',
      INVOICE: 'Hóa đơn',
    },

    // Document Fields
    docFields: {
      // Common
      owner: 'Chủ sở hữu',
      address: 'Địa chỉ',
      amount: 'Giá trị',

      // Land Title
      land_lot_no: 'Thửa đất số',
      land_map_no: 'Tờ bản đồ số',
      land_area: 'Diện tích',
      land_address: 'Địa chỉ thửa đất',
      land_purpose: 'Mục đích sử dụng',
      cert_book_entry: 'Số vào sổ cấp GCN',

      // Vehicle
      plate_number: 'Biển số xe',
      brand: 'Nhãn hiệu',
      vehicle_type: 'Loại xe',
      chassis_no: 'Số khung',
      engine_no: 'Số máy',
      valid_until: 'Hạn đăng kiểm',

      // Savings
      bank_name: 'Ngân hàng',
      book_serial: 'Mã số sổ',
      account_no: 'Số tài khoản',
      term: 'Kỳ hạn',
      maturity_date: 'Ngày đáo hạn',

      // Business Registration
      business_code: 'Mã số doanh nghiệp',
      company_name: 'Tên công ty',
      headquarters: 'Địa chỉ trụ sở',
      charter_capital: 'Vốn điều lệ',
      legal_representative: 'Người đại diện',
      representative_title: 'Chức danh',
      registration_date: 'Ngày đăng ký',

      // Patent
      patent_number: 'Số bằng',
      patent_title: 'Tên sáng chế',
      patent_owner: 'Chủ bằng độc quyền',
      inventor: 'Tác giả',
      application_number: 'Số đơn',
      application_date: 'Ngày nộp đơn',
      grant_decision: 'Quyết định cấp',
    },

    // Upload Page
    upload: {
      title: 'Tải lên chứng từ',
      subtitle: 'Tải lên chứng từ thế chấp để nhận phân tích AI và đề xuất khoản vay',
      dragDrop: 'Kéo thả file hoặc click để chọn',
      supportedFormats: 'Định dạng hỗ trợ: PDF, PNG, JPG',
      maxSize: 'Kích thước tối đa: 10MB',
      analyzing: 'AI đang phân tích...',
      extracting: 'Đang trích xuất dữ liệu...',
      scoring: 'Đang tính điểm rủi ro...',
      verifying: 'Đang xác minh OSINT...',
      complete: 'Phân tích hoàn tất',
      getLoan: 'Tạo khoản vay',
      uploadAnother: 'Tải lên chứng từ khác',
    },

    // Risk Score
    risk: {
      title: 'Điểm tín dụng',
      tier: 'Hạng',
      ltv: 'Tỷ lệ cho vay',
      interest: 'Lãi suất',
      approved: 'Được duyệt',
      rejected: 'Từ chối',
      recommendation: 'Khuyến nghị',
    },

    // OSINT
    osint: {
      title: 'Xác minh doanh nghiệp',
      website: 'Website',
      linkedin: 'LinkedIn',
      googleMaps: 'Google Maps',
      pressNews: 'Báo chí',
      socialMedia: 'Mạng xã hội',
      passed: 'Đạt',
      warning: 'Cảnh báo',
      failed: 'Không đạt',
      shellCompany: 'Phát hiện công ty ma',
      redFlags: 'Cảnh báo đỏ',
    },

    // Email
    email: {
      sendVerification: 'Gửi email xác minh',
      recipient: 'Người nhận',
      subject: 'Tiêu đề',
      body: 'Nội dung',
      sent: 'Đã gửi',
      pending: 'Đang chờ',
      failed: 'Gửi thất bại',
    },

    // Loans
    loans: {
      activeLoan: 'Khoản vay đang hoạt động',
      totalBorrowed: 'Tổng đã vay',
      totalRepaid: 'Tổng đã trả',
      overdue: 'Quá hạn',
      dueDate: 'Ngày đáo hạn',
      repay: 'Thanh toán',
      status: {
        pending: 'Chờ xử lý',
        active: 'Đang hoạt động',
        overdue: 'Quá hạn',
        defaulted: 'Vỡ nợ',
        repaid: 'Đã thanh toán',
        liquidated: 'Đã thanh lý',
      },
    },

    // Marketplace
    marketplace: {
      title: 'Sàn đấu giá NFT',
      subtitle: 'Mua NFT chứng từ với giá chiết khấu',
      currentPrice: 'Giá hiện tại',
      faceValue: 'Mệnh giá',
      discount: 'Giảm giá',
      endsIn: 'Kết thúc sau',
      placeBid: 'Đặt giá',
      bidders: 'Người đặt giá',
    },
  },

  en: {
    // Common
    common: {
      loading: 'Loading...',
      error: 'An error occurred',
      success: 'Success',
      cancel: 'Cancel',
      confirm: 'Confirm',
      save: 'Save',
      delete: 'Delete',
      edit: 'Edit',
      view: 'View',
      back: 'Back',
      next: 'Next',
      submit: 'Submit',
      search: 'Search',
    },

    // Navigation
    nav: {
      home: 'Home',
      dashboard: 'Dashboard',
      upload: 'Upload Document',
      loans: 'Loans',
      marketplace: 'Marketplace',
      settings: 'Settings',
    },

    // Document Types
    docTypes: {
      LAND_TITLE: 'Land Use Rights Certificate',
      VEHICLE: 'Vehicle Registration',
      SAVINGS: 'Savings Book',
      BUSINESS_REG: 'Business Registration Certificate',
      PATENT: 'Patent Certificate',
      INVOICE: 'Invoice',
    },

    // Document Fields
    docFields: {
      // Common
      owner: 'Owner',
      address: 'Address',
      amount: 'Value',

      // Land Title
      land_lot_no: 'Land Lot No.',
      land_map_no: 'Map Sheet No.',
      land_area: 'Area',
      land_address: 'Land Address',
      land_purpose: 'Land Use Purpose',
      cert_book_entry: 'Certificate Book Entry',

      // Vehicle
      plate_number: 'License Plate',
      brand: 'Brand',
      vehicle_type: 'Vehicle Type',
      chassis_no: 'Chassis No.',
      engine_no: 'Engine No.',
      valid_until: 'Valid Until',

      // Savings
      bank_name: 'Bank',
      book_serial: 'Book Serial',
      account_no: 'Account No.',
      term: 'Term',
      maturity_date: 'Maturity Date',

      // Business Registration
      business_code: 'Business Code',
      company_name: 'Company Name',
      headquarters: 'Headquarters',
      charter_capital: 'Charter Capital',
      legal_representative: 'Legal Representative',
      representative_title: 'Title',
      registration_date: 'Registration Date',

      // Patent
      patent_number: 'Patent No.',
      patent_title: 'Patent Title',
      patent_owner: 'Patent Owner',
      inventor: 'Inventor',
      application_number: 'Application No.',
      application_date: 'Application Date',
      grant_decision: 'Grant Decision',
    },

    // Upload Page
    upload: {
      title: 'Upload Document',
      subtitle: 'Upload collateral documents for AI analysis and loan offer',
      dragDrop: 'Drag & drop file or click to select',
      supportedFormats: 'Supported formats: PDF, PNG, JPG',
      maxSize: 'Max size: 10MB',
      analyzing: 'AI is analyzing...',
      extracting: 'Extracting data...',
      scoring: 'Calculating risk score...',
      verifying: 'OSINT verification...',
      complete: 'Analysis complete',
      getLoan: 'Get Loan',
      uploadAnother: 'Upload Another',
    },

    // Risk Score
    risk: {
      title: 'Credit Score',
      tier: 'Tier',
      ltv: 'Loan-to-Value',
      interest: 'Interest Rate',
      approved: 'Approved',
      rejected: 'Rejected',
      recommendation: 'Recommendation',
    },

    // OSINT
    osint: {
      title: 'Business Verification',
      website: 'Website',
      linkedin: 'LinkedIn',
      googleMaps: 'Google Maps',
      pressNews: 'Press & News',
      socialMedia: 'Social Media',
      passed: 'Passed',
      warning: 'Warning',
      failed: 'Failed',
      shellCompany: 'Shell Company Detected',
      redFlags: 'Red Flags',
    },

    // Email
    email: {
      sendVerification: 'Send Verification Email',
      recipient: 'Recipient',
      subject: 'Subject',
      body: 'Body',
      sent: 'Sent',
      pending: 'Pending',
      failed: 'Failed',
    },

    // Loans
    loans: {
      activeLoan: 'Active Loans',
      totalBorrowed: 'Total Borrowed',
      totalRepaid: 'Total Repaid',
      overdue: 'Overdue',
      dueDate: 'Due Date',
      repay: 'Repay',
      status: {
        pending: 'Pending',
        active: 'Active',
        overdue: 'Overdue',
        defaulted: 'Defaulted',
        repaid: 'Repaid',
        liquidated: 'Liquidated',
      },
    },

    // Marketplace
    marketplace: {
      title: 'NFT Marketplace',
      subtitle: 'Buy discounted document NFTs through auction',
      currentPrice: 'Current Price',
      faceValue: 'Face Value',
      discount: 'Discount',
      endsIn: 'Ends in',
      placeBid: 'Place Bid',
      bidders: 'Bidders',
    },
  },
};

export type Translations = typeof translations.vi;
