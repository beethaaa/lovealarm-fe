import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SERVER_URL } from '../constants/service';

const getAuthHeader = async () => {
  const token = await AsyncStorage.getItem('userToken');
  return { Authorization: `Bearer ${token}` };
};

export const userService = {
  getProfile: async () => {
    const headers = await getAuthHeader();
    const response = await axios.get(`${SERVER_URL}/api/users/me`, { headers });
    return response.data;
  },

  updateProfile: async (data: any) => {
    const headers = await getAuthHeader();
    const response = await axios.put(`${SERVER_URL}/api/users/`, data, {
      headers,
    });
    return response.data;
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
};
