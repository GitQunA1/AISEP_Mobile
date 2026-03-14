/**
 * errorMessages.js
 * Maps known backend English message strings to Vietnamese user-facing messages.
 */

const MESSAGE_MAP = {
  // --- Auth: Login ---
  'Invalid email or password': 'Email hoặc mật khẩu không đúng.',
  'Account has been banned': 'Tài khoản của bạn đã bị khóa bởi quản trị viên.',
  'Account locked due to multiple failed login attempts':
    'Tài khoản tạm thời bị khóa do đăng nhập sai quá nhiều lần. Vui lòng thử lại sau.',
  'Login successful': 'Đăng nhập thành công!',

  // --- Auth: Register ---
  'Email already registered': 'Email này đã được đăng ký. Vui lòng dùng email khác hoặc đăng nhập.',
  'User registered successfully. Please check your email to confirm your account.':
    'Đăng ký thành công! Vui lòng kiểm tra hộp thư để xác nhận tài khoản.',
  'Cannot register as Admin or Staff through public registration':
    'Không thể đăng ký vai trò này qua trang công khai.',

  // --- Auth: Email Verification ---
  'User not found': 'Không tìm thấy người dùng.',
  'Email already confirmed': 'Email của bạn đã được xác nhận trước đó.',
  'Email is already confirmed': 'Email này đã được xác nhận rồi.',
  'Email confirmed successfully! You can now login.':
    'Xác nhận email thành công! Bạn có thể đăng nhập ngay bây giờ.',
  'Invalid verification link. Missing parameters.':
    'Liên kết xác nhận không hợp lệ hoặc thiếu tham số.',
  'An error occurred during verification.':
    'Đã xảy ra lỗi trong quá trình xác nhận. Vui lòng thử lại.',
  'If the email exists, a confirmation link has been sent.':
    'Nếu email tồn tại, một liên kết xác nhận đã được gửi đến hộp thư của bạn.',
  'Confirmation email has been resent. Please check your inbox.':
    'Email xác nhận đã được gửi lại. Vui lòng kiểm tra hộp thư.',
  'Failed to send email. Please try again later.':
    'Không thể gửi email. Vui lòng thử lại sau.',

  // --- Auth: Tokens ---
  'Invalid refresh token': 'Phiên đăng nhập không hợp lệ, vui lòng đăng nhập lại.',
  'Refresh token is no longer active': 'Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại.',
  'Refresh token not found': 'Không tìm thấy phiên đăng nhập.',
  'Token is already inactive': 'Phiên đăng nhập này đã hết hiệu lực.',
  'Token revoked successfully': 'Đã thu hồi phiên đăng nhập.',
  'Token refreshed successfully': 'Phiên đăng nhập đã được gia hạn.',
  'Logout successful': 'Đăng xuất thành công.',

  // --- HTTP error fallbacks ---
  'Unauthorized': 'Bạn không có quyền thực hiện thao tác này. Vui lòng đăng nhập lại.',
  'Forbidden': 'Bạn không có quyền truy cập vào tài nguyên này.',
  'Not Found': 'Không tìm thấy tài nguyên được yêu cầu.',
  'Internal Server Error': 'Lỗi máy chủ nội bộ. Vui lòng thử lại sau.',
  'Bad Request': 'Yêu cầu không hợp lệ. Vui lòng kiểm tra lại thông tin.',
  
  // --- Projects ---
  'Project created successfully': 'Dự án đã được đăng thành công!',
  'Project updated successfully.': 'Cập nhật dự án thành công!',
  'Project approved successfully.': 'Dự án đã được duyệt thành công!',
  'Project rejected successfully.': 'Dự án đã bị từ chối.',
  'Project not found.': 'Không tìm thấy thông tin dự án.',
  'Failed to submit project': 'Không thể gửi dự án. Vui lòng thử lại sau.',
};

export function translateMessage(message) {
  if (!message) return 'Đã xảy ra lỗi không xác định.';
  if (MESSAGE_MAP[message]) return MESSAGE_MAP[message];
  for (const [key, value] of Object.entries(MESSAGE_MAP)) {
    if (message.startsWith(key) || message.includes(key)) return value;
  }
  return message;
}

export default MESSAGE_MAP;
