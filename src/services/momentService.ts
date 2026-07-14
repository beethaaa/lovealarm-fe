import axios from 'axios';
import { SERVER_URL } from '../constants/service';
import AsyncStorage from '@react-native-async-storage/async-storage';

const getAuthHeader = async () => {
  const token = await AsyncStorage.getItem('token');
  return { Authorization: `Bearer ${token}` };
};

export const momentService = {
  getCurrentMoments: async (startOfHour?: string, endOfHour?: string) => {
    try {
      const headers = await getAuthHeader();
      const response = await axios.get(`${SERVER_URL}/api/moments/current`, {
        headers,
        params: {
          startOfHour,
          endOfHour,
        },
      });
      return response.data;
    } catch (error: any) {
      console.error(
        'Error getting current moments:',
        error.response?.data || error.message,
      );
      throw new Error(
        error.response?.data?.message || 'Failed to get current moments',
      );
    }
  },

  getMomentHistory: async () => {
    try {
      const headers = await getAuthHeader();
      const response = await axios.get(`${SERVER_URL}/api/moments/history`, {
        headers,
      });
      return response.data;
    } catch (error: any) {
      console.error(
        'Error getting moment history:',
        error.response?.data || error.message,
      );
      throw new Error(
        error.response?.data?.message || 'Failed to get moment history',
      );
    }
  },

  createMoment: async (imageUri: string, caption: string) => {
    try {
      const headers = await getAuthHeader();
      const formData = new FormData();

      // In React Native, FormData requires an object with uri, type, and name for files
      const filename = imageUri.split('/').pop() || 'moment.jpg';
      const fileType = filename.split('.').pop() || 'jpeg';

      formData.append('image', {
        uri: imageUri,
        name: filename,
        type: `image/${fileType === 'jpg' ? 'jpeg' : fileType}`,
      } as any);

      formData.append('caption', caption);

      const response = await axios.post(`${SERVER_URL}/api/moments`, formData, {
        headers: {
          ...headers,
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error: any) {
      console.error(
        'Error creating moment:',
        error.response?.data || error.message,
      );
      throw new Error(
        error.response?.data?.message || 'Failed to share moment',
      );
    }
  },
};
