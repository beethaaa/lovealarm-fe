import { navigate } from '../navigation/NavigationService';

export const handleNotificationOpen = (data: any) => {
  console.log('[NotificationHandler] Handling notification open with data:', data);
  
  if (data && data.conversationId && data.senderId) {
    // Navigate to Chat screen
    // We need to pass targetUser object. At minimum it needs _id.
    // ChatScreen will fetch full profile if needed.
    navigate('Chat', {
      conversationId: data.conversationId,
      targetUser: { _id: data.senderId },
    });
  } else {
    console.warn('[NotificationHandler] Missing conversationId or senderId in data:', data);
  }
};
