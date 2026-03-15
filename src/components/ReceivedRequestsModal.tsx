import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import COLOR_PALETTE from '@/styles/colorPalette';
import { loveRequestService } from '@/services/loveRequestService';
import { userService } from '@/services/userService';
import { useAppStore } from '@/store/appStore';

const { width: W, height: H } = Dimensions.get('window');

interface ReceivedRequestsModalProps {
  visible: boolean;
  onClose: () => void;
  onRequestAccepted: (partner: any) => void;
}

const ReceivedRequestsModal: React.FC<ReceivedRequestsModalProps> = ({
  visible,
  onClose,
  onRequestAccepted,
}) => {
  const { loveRequests, setLoveRequests, setConversationId } = useAppStore();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleAccept = async (request: any) => {
    const loveRequestId = request.loveRequestId;

    if (!loveRequestId) {
      console.error('No loveRequestId found in signal object:', JSON.stringify(request));
      return;
    }

    setLoadingId(loveRequestId);
    try {
      const res = await loveRequestService.responseLoveRequest(loveRequestId, true);
      setConversationId(res.conversation?._id);

      const newList = loveRequests.filter(r => r.loveRequestId !== loveRequestId);
      setLoveRequests(newList);
      onClose();

      let senderName = request.fromUser?.name || 'User ' + request.fromUserId.slice(-4);
      let senderAvatar = request.fromUser?.avatarUrl;

      try {
        const userInfo = await userService.getUserById(request.fromUserId);
        const u = userInfo?.data?.user || userInfo?.data || userInfo?.user || userInfo;
        if (u) {
          senderName = u.name || u.profile?.name || senderName;
          senderAvatar = u.avatarUrl || u.profile?.avatarUrl || senderAvatar;
        }
      } catch (err) {
        console.warn('Failed to fetch user info', err);
      }

      const senderObj = {
        _id: request.fromUserId,
        id: request.fromUserId,
        name: senderName,
        avatarUrl: senderAvatar,
        conversationId: res.conversation?._id,
      };

      onRequestAccepted(senderObj);
    } catch (error) {
      console.error('Failed to accept request:', error);
    } finally {
      setLoadingId(null);
    }
  };

  const renderItem = ({ item }: { item: any }) => {

    const id = item.loveRequestId;
    const isAccepting = loadingId === id;

    return (
      <View style={styles.requestItem}>
        {/* <View style={styles.avatarContainer}>
          {senderAvatar ? (
            <Image source={{ uri: senderAvatar }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.initials}>{senderName?.[0]?.toUpperCase() || '?'}</Text>
            </View>
          )}
        </View> */}
        <View style={styles.info}>
          <Text style={styles.name}>{item.fromUserId}</Text>
          <TouchableOpacity
            style={styles.acceptBtn}
            onPress={() => handleAccept(item)}
            disabled={isAccepting}
          >
            <Icon
              name={
                isAccepting ? 'refresh-outline' : 'checkmark-circle-outline'
              }
              size={18}
              color={COLOR_PALETTE.pink}
            />
            <Text style={styles.acceptText}>
              {isAccepting ? 'Accepting...' : 'Accept'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}> New Signals</Text>
            <TouchableOpacity onPress={onClose}>
              <Icon name="close" size={24} color="rgba(255,255,255,0.5)" />
            </TouchableOpacity>
          </View>

          <FlatList
            data={loveRequests}
            keyExtractor={item => item.loveRequestId}
            renderItem={renderItem}
            contentContainerStyle={styles.list}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Text style={styles.emptyText}>No signals yet.</Text>
              </View>
            }
          />
        </View>
      </View>
    </Modal>
  );
};

export default ReceivedRequestsModal;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    width: W * 0.85,
    maxHeight: H * 0.6,
    backgroundColor: '#0D0D0D',
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 194, 209, 0.25)',
    padding: 20,
    boxShadow: '0px 0px 20px 0px rgba(255, 194, 209, 0.1)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    color: COLOR_PALETTE.pink,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  list: {
    paddingBottom: 10,
  },
  requestItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
  },
  avatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
    marginRight: 15,
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#333',
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  info: {
    flex: 1,
  },
  name: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
  },
  acceptBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  acceptText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  empty: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 14,
  },
});
