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
import { userService } from '@/services/userService';
import LinearGradient from 'react-native-linear-gradient';

const ConversationRow = ({
  item,
  currentUser,
  navigation,
}: {
  item: any;
  currentUser: any;
  navigation: any;
}) => {
  const [partnerInfo, setPartnerInfo] = useState<any>(null);
  console.log('item', item);

  const myId = currentUser?._id;
  const partnerId = Array.isArray(item.participants)
    ? item.participants.find((p: string) => p !== myId)
    : null;

  useEffect(() => {
    const fetchPartner = async () => {
      if (!partnerId) return;
      try {
        const res = await userService.getUserById(partnerId);
        const u = res.data;
        if (u) {
          setPartnerInfo(u);
        }
      } catch {
        console.warn(
          'Failed to fetch partner info for conversation:',
          partnerId,
        );
      }
    };
    fetchPartner();
  }, [partnerId]);

  const displayPartner = partnerInfo
    ? {
        ...partnerInfo,
        name: partnerInfo.profile?.name,
        avatarUrl: partnerInfo.avatarUrl,
      }
    : {};

  return (
    <TouchableOpacity
      style={styles.chatRow}
      onPress={() =>
        navigation.navigate('Chat', {
          targetUser: displayPartner,
          conversationId: item._id,
        })
      }
    >
      <View style={styles.avatarWrapper}>
        <LinearGradient
          colors={[COLOR_PALETTE.pink, COLOR_PALETTE.roseRed]}
          style={styles.avatarGlow}
        >
          <View style={styles.avatarContainer}>
            {displayPartner.avatarUrl ? (
              <Image
                source={{ uri: displayPartner.avatarUrl }}
                style={styles.avatar}
              />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.initials}>
                  {displayPartner.name?.[0] || '?'}
                </Text>
              </View>
            )}
          </View>
        </LinearGradient>
        <View style={styles.statusInList} />
      </View>
      <View style={styles.info}>
        <Text style={styles.name}>{displayPartner.name || 'Anonymous'}</Text>
        <Text style={styles.lastMessage} numberOfLines={1}>
          {item.lastSeen
            ? `Waiting for ${displayPartner.name || 'Partner'} to respond...`
            : `Start conversation with ${displayPartner.name || 'Partner'} now.`}
        </Text>
      </View>
      <View style={styles.arrowContainer}>
        <Icon name="chevron-forward" size={18} color={COLOR_PALETTE.pink} />
      </View>
    </TouchableOpacity>
  );
};

const ChatListScreen = () => {
  const navigation = useNavigation<any>();
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { user: currentUser } = useAppStore();

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const res = await loveRequestService.getConversations();
        setConversations(res.data || []);
      } catch (error) {
        console.error('Failed to fetch conversations:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchConversations();
  }, []);

  const renderItem = ({ item }: { item: any }) => (
    <ConversationRow
      item={item}
      currentUser={currentUser}
      navigation={navigation}
    />
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#050505" />
      
      <LinearGradient
        colors={['rgba(13, 13, 13, 0.95)', 'rgba(5, 5, 5, 1)']}
        style={styles.header}
      >
        <View style={styles.headerTop}>
          <Text style={styles.title}>Signals</Text>
          <View style={styles.headerBadges}>
            <View style={styles.badge}>
              <Icon name="heart" size={12} color="#FFF" />
              <Text style={styles.badgeText}>{conversations.length}</Text>
            </View>
          </View>
        </View>
        
        {/* Search Placeholder / Decorative bar */}
        <View style={styles.searchBar}>
          <Icon name="search" size={18} color="rgba(255,255,255,0.3)" />
          <Text style={styles.searchPlaceholder}>Search friends...</Text>
        </View>
      </LinearGradient>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLOR_PALETTE.pink} />
          <Text style={styles.loadingText}>Syncing hearts...</Text>
        </View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={item => item.id || item._id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.empty}>
              <LinearGradient
                colors={['rgba(255, 194, 209, 0.1)', 'transparent']}
                style={styles.emptyGlow}
              >
                <Icon
                  name="heart-dislike-outline"
                  size={80}
                  color="rgba(255, 194, 209, 0.3)"
                />
              </LinearGradient>
              <Text style={styles.emptyText}>
                The radar is quiet...
              </Text>
              <Text style={styles.emptySubtext}>
                Turn on your Love Alarm radar to find someone special nearby!
              </Text>
              <TouchableOpacity 
                style={styles.findBtn}
                onPress={() => navigation.navigate('Main')}
              >
                <Text style={styles.findBtnText}>Open Radar</Text>
              </TouchableOpacity>
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
    backgroundColor: '#050505',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  title: {
    color: '#FFF',
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 1,
  },
  headerBadges: {
    flexDirection: 'row',
    gap: 10,
  },
  badge: {
    backgroundColor: COLOR_PALETTE.pink,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    shadowColor: COLOR_PALETTE.pink,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 5,
  },
  badgeText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '800',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  searchPlaceholder: {
    color: 'rgba(255, 255, 255, 0.3)',
    marginLeft: 12,
    fontSize: 15,
  },
  list: {
    padding: 20,
    paddingBottom: 100,
  },
  chatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0D0D0D',
    borderRadius: 24,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 194, 209, 0.15)',
    boxShadow: 'inset 0px 1px 4px 0px rgba(255, 255, 255, 0.05)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  avatarWrapper: {
    position: 'relative',
    marginRight: 16,
  },
  avatarGlow: {
    width: 64,
    height: 64,
    borderRadius: 32,
    padding: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarContainer: {
    width: '100%',
    height: '100%',
    borderRadius: 30,
    overflow: 'hidden',
    backgroundColor: '#1A1A1A',
    borderWidth: 2,
    borderColor: '#000',
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
    fontSize: 22,
    fontWeight: '800',
  },
  statusInList: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#22C55E',
    borderWidth: 2,
    borderColor: '#0D0D0D',
  },
  info: {
    flex: 1,
    gap: 4,
  },
  name: {
    color: '#FFF',
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  lastMessage: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 13,
    fontWeight: '500',
  },
  arrowContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 194, 209, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 1,
  },
  empty: {
    marginTop: 60,
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyGlow: {
    width: 160,
    height: 160,
    borderRadius: 80,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyText: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: '900',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptySubtext: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 15,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 30,
  },
  findBtn: {
    backgroundColor: 'rgba(255, 194, 209, 0.1)',
    paddingHorizontal: 30,
    paddingVertical: 14,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: COLOR_PALETTE.pink,
  },
  findBtnText: {
    color: COLOR_PALETTE.pink,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
