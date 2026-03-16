import axios from 'axios';
import { SERVER_URL } from '../constants/service';
import AsyncStorage from '@react-native-async-storage/async-storage';

// In-memory cache for in-flight conversation creation to prevent duplicates from rapid clicks
const inFlightCreations: Record<string, Promise<any> | undefined> = {};

export const chatService = {
  createConversationAPI: async (participants: string[]) => {
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

  createConversation: async (participants: string[]) => {
    const normalizedTarget = participants.map(p => p.toString()).sort();
    const key = normalizedTarget.join(',');

    // If there's already a creation in progress for these participants, wait for it
    if (inFlightCreations[key]) {
      console.log('[chatService] Waiting for in-flight creation for:', key);
      return inFlightCreations[key];
    }

    const creationPromise = (async () => {
      try {
        console.log('[chatService] Checking for existing conversation with participants:', normalizedTarget);
        
        const token = await AsyncStorage.getItem('token');
        const allConvsRes = await axios.get(`${SERVER_URL}/api/conversation`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const allConvs = Array.isArray(allConvsRes.data)
            ? allConvsRes.data
            : allConvsRes.data?.data || [];

        console.log(`[chatService] Found ${allConvs.length} total conversations on server`);

        const existingConv = allConvs.find((c: any) => {
          const convParticipants = (c.participants || []).map((p: any) => {
            if (typeof p === 'object' && p !== null) {
              return (p._id || p.id || '').toString();
            }
            return (p || '').toString();
          }).filter((p: string) => p !== '').sort();

          if (convParticipants.length !== normalizedTarget.length) return false;
          
          return normalizedTarget.every((val, index) => val === convParticipants[index]);
        });

        if (existingConv) {
          console.log('[chatService] MATCH FOUND! Existing Conversation ID:', existingConv._id || existingConv.id);
          return existingConv;
        }

        console.log('[chatService] No existing conversation found. Creating new one...');
        return await chatService.createConversationAPI(participants);
      } catch (error: any) {
        console.error('Error in createConversation logic:', error.message);
        return await chatService.createConversationAPI(participants);
      } finally {
        // Clean up in-flight tracker after a short delay to handle potential race conditions during navigation
        setTimeout(() => {
          delete inFlightCreations[key];
        }, 2000);
      }
    })();

    inFlightCreations[key] = creationPromise;
    return creationPromise;
  },

  getOrCreateConversation: async (currentUserId: string, partnerId: string) => {
    const participants = [currentUserId, partnerId];
    return await chatService.createConversation(participants);
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
