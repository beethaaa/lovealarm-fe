import axios from 'axios';
import { SERVER_URL } from '../constants/service';
import AsyncStorage from '@react-native-async-storage/async-storage';

const getAuthHeader = async () => {
  const token = await AsyncStorage.getItem('token');
  return { Authorization: `Bearer ${token}` };
};

export const userService = {
  updateUser: async (data: any) => {
    try {
      let token = await AsyncStorage.getItem('token');
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
      console.error(
        'Lỗi Axios Update User:',
        error.response?.data || error.message,
      );
      throw new Error(
        error.response?.data?.message ||
          'Không thể cập nhật thông tin người dùng',
      );
    }
  },
  updateProfile: async (formData: FormData) => {
    const headers = await getAuthHeader();
    const response = await axios.put(`${SERVER_URL}/api/users/`, formData, {
      headers: {
        ...headers,
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
  getProfile: async () => {
    try {
      let token = await AsyncStorage.getItem('token');
      if (!token) {
        token = await AsyncStorage.getItem('token');
      }
      const response = await axios.get(`${SERVER_URL}/api/users/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      console.log('[userService] getProfile RAW response:', JSON.stringify(response.data));
      return response.data;
    } catch (error: any) {
      console.error(
        'Lỗi Axios Get Profile:',
        error.response?.data || error.message,
      );
      throw new Error(
        error.response?.data?.message || 'Không thể lấy thông tin người dùng',
      );
    }
  },
  updatePassword: async (passwordData: any) => {
    const headers = await getAuthHeader();
    const response = await axios.put(
      `${SERVER_URL}/api/users/password`,
      passwordData,
      { headers },
    );
    return response.data;
  },
  getUserById: async (userId: string) => {
    try {
      let token = await AsyncStorage.getItem('token');
      const response = await axios.get(`${SERVER_URL}/api/users/profile/${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      console.log(`[userService] getUserById(${userId}) RAW response:`, JSON.stringify(response.data));
      return response.data;
    } catch (error: any) {
      console.error(
        'Lỗi Axios Get User by id:',
        error.response?.data || error.message,
      );
      throw new Error(
        error.response?.data?.message || 'Không thể lấy thông tin người dùng',
      );
    }
  },
  getAllInterests: async () => {
    const headers = await getAuthHeader();
    const response = await axios.get(`${SERVER_URL}/api/interests/`, {
      headers,
    });
    return response.data;
  },

  getAllPersonalityTags: async () => {
    const headers = await getAuthHeader();
    const response = await axios.get(`${SERVER_URL}/api/personality-tags/`, {
      headers,
    });
    return response.data;
  },
};
