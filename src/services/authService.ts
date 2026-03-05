import axios from 'axios';
import { SERVER_URL } from '../constants/service';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const authApi = {
  login: async (email: string, password: string) => {
    try {
      const response = await axios.post(
        `${SERVER_URL}/auth/login`,
        { email, password },
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 30000,
        },
      );
      await AsyncStorage.setItem('token', response.data.accessToken);
      return response.data;
    } catch (error: any) {
      console.error('Lỗi Axios Login:', error.response?.data || error.message);
      const errorMessage =
        error.response?.data?.message || 'Đăng nhập không thành công';
      throw new Error(errorMessage);
    }
  },

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
      return response.data;
    } catch (error: any) {
      console.error(
        'Lỗi Axios Register:',
        error.response?.data || error.message,
      );
      const errorMessage =
        error.response?.data?.message || 'Đăng ký không thành công';
      throw new Error(errorMessage);
    }
  },

  logout: async () => {
    try {
      await axios.post(`${SERVER_URL}/auth/logout`);
      await AsyncStorage.removeItem('token');
    } catch (error) {
      console.error('Logout API error:', error);
    }
  },
};
