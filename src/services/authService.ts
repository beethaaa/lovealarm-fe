import axios from 'axios';
import { SERVER_URL } from '../constants/service';

export const authApi = {
  // --- ĐĂNG NHẬP ---
  login: async (email: string, password: string) => {
    try {
      // Thêm timeout 30s vì server Render có thể khởi động chậm
      const response = await axios.post(
        `${SERVER_URL}/auth/login`,
        { email, password },
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 30000,
        },
      );

      // Log để bạn kiểm tra cấu trúc data thực tế tại Metro Terminal
      console.log('--- LOGIN DEBUG ---');
      console.log('Payload gửi đi:', { email, password });
      console.log('Phản hồi thô:', response.data);

      return response.data;
    } catch (error: any) {
      console.error('Lỗi Axios Login:', error.response?.data || error.message);
      const errorMessage =
        error.response?.data?.message || 'Đăng nhập không thành công';
      throw new Error(errorMessage);
    }
  },

  // --- ĐĂNG KÝ (Hàm mới được thêm vào) ---
  register: async (email: string, password: string) => {
    try {
      const response = await axios.post(
        `${SERVER_URL}/auth/register`,
        { email, password },
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 30000,
        },
      );

      console.log('--- REGISTER DEBUG ---');
      console.log('Payload gửi đi:', { email, password });
      console.log('Phản hồi thô:', response.data);

      return response.data;
    } catch (error: any) {
      console.error(
        'Lỗi Axios Register:',
        error.response?.data || error.message,
      );
      // Lấy thông báo lỗi cụ thể từ Backend (ví dụ: "Email already exists")
      const errorMessage =
        error.response?.data?.message || 'Đăng ký không thành công';
      throw new Error(errorMessage);
    }
  },

  // --- ĐĂNG XUẤT ---
  logout: async () => {
    try {
      await axios.post(`${SERVER_URL}/auth/logout`);
    } catch (error) {
      console.error('Logout API error:', error);
      // Vẫn tiếp tục cho phép logout ở client dù API lỗi
    }
  },
};
