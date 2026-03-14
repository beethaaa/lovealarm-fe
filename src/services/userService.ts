import axios from 'axios';
import { SERVER_URL } from '../constants/service';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const userService = {
  updateUser: async (data: any) => {
    try {
      let token = await AsyncStorage.getItem('userToken');
      if (!token) {
        token = await AsyncStorage.getItem('token');
      }
      const response = await axios.put(`${SERVER_URL}/api/users`, data, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        timeout: 30000,
      });
      return response.data;
    } catch (error: any) {
      console.error('Lỗi Axios Update User:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Không thể cập nhật thông tin người dùng');
    }
  },
  getProfile: async () => {
    try {
      let token = await AsyncStorage.getItem('userToken');
      if (!token) {
        token = await AsyncStorage.getItem('token');
      }
      const response = await axios.get(`${SERVER_URL}/api/users/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error: any) {
      console.error('Lỗi Axios Get Profile:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Không thể lấy thông tin người dùng');
    }
  },
};
