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
  getUser: async (token?: string) => {
    try {
      let authToken = token || await AsyncStorage.getItem('userToken') || await AsyncStorage.getItem('token');
      if (!authToken) return null;
      
      const response = await axios.get(`${SERVER_URL}/api/users`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        timeout: 10000,
      });
      return response.data;
    } catch (error) {
      console.log('Lỗi lấy profile:', error);
      return null;
    }
  }
};
