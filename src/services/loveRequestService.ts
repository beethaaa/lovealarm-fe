import axios from 'axios';
import { SERVER_URL } from '../constants/service';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const loveRequestService = {
  sendLoveRequest: async (toUserId: string) => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await axios.post(
        `${SERVER_URL}/api/love-request`,
        { toUserId },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        },
      );
      return response.data;
    } catch (error: any) {
      console.error(
        'Error sending love request:',
        error.response?.data || error.message,
      );
      throw new Error(
        error.response?.data?.message || 'Failed to send love request',
      );
    }
  },

  getLoveRequests: async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await axios.get(`${SERVER_URL}/api/love-request`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error: any) {
      console.error(
        'Error getting love requests:',
        error.response?.data || error.message,
      );
      throw new Error(
        error.response?.data?.message || 'Failed to get love requests',
      );
    }
  },

  responseLoveRequest: async (loveRequestId: string, isAccepted: boolean) => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await axios.put(
        `${SERVER_URL}/api/love-request/accept`,
        {
          loveRequestId,
          isAccepted,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      return response.data;
    } catch (error: any) {
      console.error(
        'Error accepting love request:',
        error.response?.data || error.message,
      );
      throw new Error(
        error.response?.data?.message || 'Failed to accept love request',
      );
    }
  },

  updateStatusLoveRequest: async (loveRequestId: string, status: string) => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await axios.put(
        `${SERVER_URL}/api/love-request`,
        { loveRequestId, status },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      return response.data;
    } catch (error: any) {
      console.error(
        'Error updating love request status:',
        error.response?.data || error.message,
      );
      throw new Error(
        error.response?.data?.message || 'Failed to update love request status',
      );
    }
  },

  getConversations: async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await axios.get(`${SERVER_URL}/api/conversation`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error: any) {
      console.error(
        'Error getting conversations:',
        error.response?.data || error.message,
      );
      throw new Error(
        error.response?.data?.message || 'Failed to get conversations',
      );
    }
  },
};
