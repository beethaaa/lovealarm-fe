import axios from 'axios';
import { SERVER_URL } from '../constants/service';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const coupleService = {
  getCoupleInfo: async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await axios.get(`${SERVER_URL}/api/couples`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error: any) {
      console.error(
        'Error getting couple info:',
        error.response?.data || error.message,
      );
      throw new Error(
        error.response?.data?.message || 'Failed to get couple info',
      );
    }
  },

  leaveCoupleMode: async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await axios.post(
        `${SERVER_URL}/api/couples/leave`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      return response.data;
    } catch (error: any) {
      console.error(
        'Error leaving couple mode:',
        error.response?.data || error.message,
      );
      throw new Error(
        error.response?.data?.message || 'Failed to leave couple mode',
      );
    }
  },
};
