import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Image,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import COLOR_PALETTE from '@/styles/colorPalette';
import { loveRequestService } from '@/services/loveRequestService';
import { useAppStore } from '@/store/appStore';
import Icon from 'react-native-vector-icons/Ionicons';

const ChatListScreen = () => {
  const navigation = useNavigation<any>();
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const res = await loveRequestService.getConversations();
        setConversations(res.data || res || []);
      } catch (error) {
        console.error('Failed to fetch conversations:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchConversations();
  }, []);

  const { user: currentUser } = useAppStore();

  const renderItem = ({ item }: { item: any }) => {
    const partner = item.partner || item.targetUser || item.toUser || {};
    const isISent = (item.senderId || item.fromUserId) === (currentUser?.id || currentUser?._id);
    
    return (
      <TouchableOpacity
        style={styles.chatRow}
        onPress={() => navigation.navigate('Chat', { 
          targetUser: partner, 
          conversationId: item.id || item._id 
        })}
      >
        <View style={styles.avatarContainer}>
          {partner.avatarUrl ? (
            <Image source={{ uri: partner.avatarUrl }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.initials}>{partner.name?.[0] || '?'}</Text>
            </View>
          )}
        </View>
        <View style={styles.info}>
          <Text style={styles.name}>{partner.name || 'Anonymous'}</Text>
          <Text style={styles.lastMessage} numberOfLines={1}>
            {item.lastMessage || 
              (isISent ? `${partner.name} đã chấp nhận tín hiệu của bạn` : 'Các bạn đã trở thành bạn bè')}
          </Text>
        </View>
        <Icon name="chevron-forward" size={16} color="rgba(255,255,255,0.2)" />
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0A0A0A" />
      <View style={styles.header}>
        <Text style={styles.title}>Friends</Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={COLOR_PALETTE.pink} />
        </View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={item => item.id || item._id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Icon name="people-outline" size={60} color="rgba(255,255,255,0.1)" />
              <Text style={styles.emptyText}>No one in your friend list yet.</Text>
              <Text style={styles.emptySubtext}>Turn on radar to find your other half!</Text>
            </View>
          }
        />
      )}
    </View>
  );
};

export default ChatListScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  title: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: '800',
  },
  list: {
    padding: 20,
  },
  chatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 20,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  avatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    overflow: 'hidden',
    marginRight: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#1A1A1A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    color: COLOR_PALETTE.pink,
    fontSize: 20,
    fontWeight: '700',
  },
  info: {
    flex: 1,
  },
  name: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  lastMessage: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 13,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  empty: {
    marginTop: 100,
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 20,
    textAlign: 'center',
  },
  emptySubtext: {
    color: 'rgba(255, 255, 255, 0.3)',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
});
