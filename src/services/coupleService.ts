import { SERVER_URL } from '@/constants/service';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

export const coupleService = {
  acceptCouple: async (toUserId: string) => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await axios.post(
        `${SERVER_URL}/api/couples/accept`,
        { toUserId },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        },
      );
      console.log(response);
    } catch (error: any) {
      console.error(
        'Error creating conversation:',
        error.response?.data || error.message,
      );
      throw new Error(
        error.response?.data?.message || 'Failed to create conversation',
      );
    }
  },
};
