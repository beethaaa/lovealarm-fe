import axios from 'axios';
import { SERVER_URL } from '../constants/service';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const chatService = {
  createConversation: async (participants: string[]) => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await axios.post(
        `${SERVER_URL}/api/conversation`,
        { participants },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        },
      );
      return response.data;
    } catch (error: any) {
      console.error('Error creating conversation:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Failed to create conversation');
    }
  },

  getMessages: async (conversationId: string) => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await axios.get(`${SERVER_URL}/api/messages/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params: {
          conversationId,
        },
      });
      return response.data;
    } catch (error: any) {
      console.error('Error getting messages:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Failed to get messages');
    }
  },

  startAIConversation: async (interests: string[] = ['any']) => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await axios.post(
        `${SERVER_URL}/api/ai/conversation-start`,
        { interests },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        },
      );
      return response.data;
    } catch (error: any) {
      console.error('Error starting AI conversation:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Failed to start AI conversation');
    }
  },
};
