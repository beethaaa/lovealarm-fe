import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Image,
  StatusBar,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import COLOR_PALETTE from '@/styles/colorPalette';
import { loveRequestService } from '@/services/loveRequestService';
import { useAppStore } from '@/store/appStore';
import Icon from 'react-native-vector-icons/Ionicons';
import { userService } from '@/services/userService';
import LinearGradient from 'react-native-linear-gradient';
import LoadingOverlay from '@/components/LoadingOverlay';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const assets = {
  button: require('../assets/button.webp'),
  cloud: require('../assets/cloud.webp'),
  butterfly: require('../assets/butterfly_light.webp'),
};

const getParticipantId = (participant: any) =>
  (typeof participant === 'object'
    ? participant?._id || participant?.id
    : participant
  )?.toString();

const getPartnerId = (item: any, currentUser: any) => {
  const myId = (currentUser?._id || currentUser?.id)?.toString();
  if (!Array.isArray(item.participants)) return null;
  return item.participants
    .map(getParticipantId)
    .find((id: string | undefined) => id && id !== myId);
};

const normalizePartner = (user: any) => ({
  ...user,
  name: user?.profile?.name || user?.name || user?.username,
  avatarUrl: user?.avatarUrl || user?.profile?.avatarUrl,
});

const UserAvatar = ({ user, size = 58 }: { user: any; size?: number }) => {
  const radius = size / 2;
  const imageSize = size - 6;

  return (
    <View style={{ width: size, height: size }}>
      <LinearGradient
        colors={['#FFF7E9', COLOR_PALETTE.pink, COLOR_PALETTE.roseRed]}
        style={[
          styles.avatarGlow,
          { width: size, height: size, borderRadius: radius },
        ]}
      >
        <View
          style={[
            styles.avatarInner,
            {
              width: imageSize,
              height: imageSize,
              borderRadius: imageSize / 2,
            },
          ]}
        >
          {user?.avatarUrl ? (
            <Image
              source={{ uri: user.avatarUrl }}
              style={styles.avatarImage}
            />
          ) : (
            <Text style={styles.avatarInitial}>{user?.name?.[0] || '?'}</Text>
          )}
        </View>
      </LinearGradient>
      <View style={styles.onlineDot} />
    </View>
  );
};

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
  const partnerId = getPartnerId(item, currentUser);

  useEffect(() => {
    const fetchPartner = async () => {
      if (!partnerId) return;
      try {
        const res = await userService.getUserById(partnerId);
        const u = res.data;
        if (u) setPartnerInfo(normalizePartner(u));
      } catch {
        console.warn(
          'Failed to fetch partner info for conversation:',
          partnerId,
        );
      }
    };
    fetchPartner();
  }, [partnerId]);

  const displayPartner = partnerInfo || { name: 'Anonymous' };

  return (
    <TouchableOpacity
      style={styles.chatRow}
      activeOpacity={0.86}
      onPress={() =>
        navigation.navigate('Chat', {
          targetUser: displayPartner,
          conversationId: item._id || item.id,
        })
      }
    >
      <UserAvatar user={displayPartner} size={62} />
      <View style={styles.rowInfo}>
        <View style={styles.rowTitleLine}>
          <Text style={styles.rowName} numberOfLines={1}>
            {displayPartner.name || 'Anonymous'}
          </Text>
          <View style={styles.friendBadge}>
            <Icon name="heart" size={9} color={COLOR_PALETTE.roseRed} />
            <Text style={styles.friendBadgeText}>Friend</Text>
          </View>
        </View>
        <Text style={styles.lastMessage} numberOfLines={1}>
          {item.lastSeen
            ? `Waiting for ${displayPartner.name || 'Partner'} to respond...`
            : `Start conversation with ${
                displayPartner.name || 'Partner'
              } now.`}
        </Text>
      </View>
      <View style={styles.rowArrow}>
        <Icon name="chevron-forward" size={18} color={COLOR_PALETTE.pink} />
      </View>
    </TouchableOpacity>
  );
};

const ActiveFriendBubble = ({ item, currentUser, navigation }: any) => {
  const [partnerInfo, setPartnerInfo] = useState<any>(null);
  const partnerId = getPartnerId(item, currentUser);

  useEffect(() => {
    const fetchPartner = async () => {
      if (!partnerId) return;
      try {
        const res = await userService.getUserById(partnerId);
        const u = res.data;
        if (u) setPartnerInfo(normalizePartner(u));
      } catch {}
    };
    fetchPartner();
  }, [partnerId]);

  if (!partnerInfo) return null;

  return (
    <TouchableOpacity
      style={styles.activeFriendBubble}
      activeOpacity={0.86}
      onPress={() =>
        navigation.navigate('Chat', {
          targetUser: partnerInfo,
          conversationId: item._id || item.id,
        })
      }
    >
      <UserAvatar user={partnerInfo} size={58} />
      <Text style={styles.activeFriendName} numberOfLines={1}>
        {partnerInfo.name?.split(' ')[0] || 'Unknown'}
      </Text>
    </TouchableOpacity>
  );
};

const ChatListScreen = () => {
  const navigation = useNavigation<any>();
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { user: currentUser } = useAppStore();

  const fetchConversations = useCallback(async () => {
    try {
      setLoading(true);
      const res = await loveRequestService.getConversations();
      const raw = res.data || [];

      const filtered: any[] = [];
      const seenPairs = new Set<string>();

      raw.forEach((c: any) => {
        const participants = (c.participants || [])
          .map(getParticipantId)
          .filter(Boolean)
          .sort();

        if (participants.length === 2) {
          const pairKey = participants.join(',');
          if (!seenPairs.has(pairKey)) {
            seenPairs.add(pairKey);
            filtered.push(c);
          }
        } else {
          filtered.push(c);
        }
      });

      setConversations(filtered);
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConversations();
    const unsubscribe = navigation.addListener('focus', () => {
      fetchConversations();
    });
    return unsubscribe;
  }, [fetchConversations, navigation]);

  const renderActiveFriendsList = () => {
    if (!conversations || conversations.length === 0) return null;
    return (
      <View style={styles.activeFriendsContainer}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Active friends</Text>
          <View style={styles.sectionPill}>
            <Icon name="sparkles" size={12} color={COLOR_PALETTE.roseRed} />
            <Text style={styles.sectionPillText}>Online</Text>
          </View>
        </View>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={conversations}
          keyExtractor={item => 'active_' + (item.id || item._id)}
          renderItem={({ item }) => (
            <ActiveFriendBubble
              item={item}
              currentUser={currentUser}
              navigation={navigation}
            />
          )}
          contentContainerStyle={styles.activeFriendsList}
        />
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#020001" />
      <LinearGradient
        colors={['#000000', '#030002', '#110511', '#25051C']}
        locations={[0, 0.46, 0.76, 1]}
        style={StyleSheet.absoluteFillObject}
      />

      <View pointerEvents="none" style={styles.backgroundAssets}>
        <Image
          source={assets.cloud}
          style={styles.cloudLeft}
          resizeMode="contain"
        />
        <Image
          source={assets.cloud}
          style={styles.cloudRight}
          resizeMode="contain"
        />
        <Image
          source={assets.butterfly}
          style={styles.butterfly}
          resizeMode="contain"
        />
      </View>

      <View style={styles.contentLayer}>
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.kicker}>DearU Radar</Text>
              <Text style={styles.title}>Signals</Text>
            </View>
            <View style={styles.badge}>
              <Icon name="heart" size={12} color="#FFF" />
              <Text style={styles.badgeText}>{conversations.length}</Text>
            </View>
          </View>

          <View style={styles.searchFrame}>
            <Image
              source={assets.button}
              style={styles.searchButtonAsset}
              resizeMode="stretch"
            />
            <View style={styles.searchContent}>
              <Text style={styles.searchPlaceholder}>Search friends...</Text>
            </View>
          </View>
        </View>

        <FlatList
          data={conversations}
          keyExtractor={item => item.id || item._id}
          renderItem={({ item }) => (
            <ConversationRow
              item={item}
              currentUser={currentUser}
              navigation={navigation}
            />
          )}
          contentContainerStyle={styles.list}
          ListHeaderComponent={renderActiveFriendsList}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            !loading ? (
              <View style={styles.empty}>
                <Icon
                  name="heart-dislike-outline"
                  size={58}
                  color="rgba(255, 194, 209, 0.48)"
                />
                <Text style={styles.emptyText}>The radar is quiet...</Text>
                <Text style={styles.emptySubtext}>
                  Turn on your DearU radar to find someone special nearby.
                </Text>
              </View>
            ) : null
          }
        />
      </View>
      <LoadingOverlay visible={loading} message="Syncing hearts..." />
    </View>
  );
};

export default ChatListScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020001',
    overflow: 'hidden',
  },
  backgroundAssets: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
  },
  contentLayer: {
    flex: 1,
    zIndex: 2,
  },
  header: {
    paddingTop: 58,
    paddingHorizontal: 28,
    paddingBottom: 10,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  kicker: {
    color: COLOR_PALETTE.amaranthPink,
    fontSize: 11,
    fontWeight: '800',
    marginBottom: 4,
  },
  title: {
    color: '#FFF',
    fontSize: 30,
    fontWeight: '900',
    textShadowColor: COLOR_PALETTE.roseRed,
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 12,
  },
  badge: {
    minWidth: 48,
    height: 32,
    borderRadius: 18,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 226, 234, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255, 226, 234, 0.35)',
  },
  badgeText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '900',
  },
  searchFrame: {
    height: 58,
    justifyContent: 'center',
    overflow: 'visible',
  },
  searchButtonAsset: {
    position: 'absolute',
    left: -8,
    right: -8,
    top: -16,
    width: '104%',
    height: 110,
    opacity: 0.96,
    transform: [{ translateY: -6 }, { scaleX: 1.1 }],
  },
  searchContent: {
    height: 44,
    marginLeft: 28,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
  },
  searchPlaceholder: {
    flex: 1,
    color: '#7b0b24',
    fontSize: 15,
    fontWeight: '700',
    transform: [{ translateY: 3 }],
  },
  list: {
    paddingHorizontal: 28,
    paddingBottom: 150,
  },
  activeFriendsContainer: {
    paddingTop: 12,
    paddingBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  sectionTitle: {
    color: '#FFF4F7',
    fontSize: 14,
    fontWeight: '900',
  },
  sectionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: COLOR_PALETTE.mimiPink,
  },
  sectionPillText: {
    color: COLOR_PALETTE.roseRed,
    fontSize: 11,
    fontWeight: '900',
  },
  activeFriendsList: {
    gap: 18,
  },
  activeFriendBubble: {
    width: 62,
    alignItems: 'center',
  },
  activeFriendName: {
    marginTop: 7,
    color: '#FFF4F7',
    fontSize: 11,
    fontWeight: '800',
    textAlign: 'center',
  },
  chatRow: {
    minHeight: 84,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginBottom: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(22, 3, 13, 0.76)',
    borderWidth: 1,
    borderColor: 'rgba(255, 194, 209, 0.28)',
    shadowColor: COLOR_PALETTE.roseRed,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.26,
    shadowRadius: 16,
    elevation: 8,
  },
  avatarGlow: {
    padding: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInner: {
    overflow: 'hidden',
    backgroundColor: COLOR_PALETTE.mimiPink,
    borderWidth: 2,
    borderColor: '#070104',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarInitial: {
    color: COLOR_PALETTE.roseRed,
    fontSize: 22,
    fontWeight: '900',
  },
  onlineDot: {
    position: 'absolute',
    right: 0,
    bottom: 1,
    width: 13,
    height: 13,
    borderRadius: 7,
    backgroundColor: '#22C55E',
    borderWidth: 2,
    borderColor: '#050104',
  },
  rowInfo: {
    flex: 1,
    marginLeft: 12,
    gap: 6,
  },
  rowTitleLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rowName: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '900',
    flexShrink: 1,
  },
  friendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    backgroundColor: COLOR_PALETTE.mimiPink,
  },
  friendBadgeText: {
    color: COLOR_PALETTE.roseRed,
    fontSize: 9,
    fontWeight: '900',
  },
  lastMessage: {
    color: 'rgba(255, 226, 234, 0.55)',
    fontSize: 12,
    fontWeight: '600',
  },
  rowArrow: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  empty: {
    alignItems: 'center',
    paddingTop: 70,
    paddingHorizontal: 24,
  },
  emptyText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '900',
    marginTop: 16,
  },
  emptySubtext: {
    color: 'rgba(255, 226, 234, 0.58)',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 19,
    marginTop: 8,
  },
  cloudLeft: {
    position: 'absolute',
    left: -70,
    bottom: -28,
    width: Math.min(SCREEN_WIDTH * 0.78, 360),
    height: 210,
    opacity: 0.28,
    transform: [{ scale: 1.8 }],
  },
  cloudRight: {
    position: 'absolute',
    right: -78,
    bottom: -22,
    width: Math.min(SCREEN_WIDTH * 0.72, 340),
    height: 210,
    opacity: 0.3,
    transform: [{ scaleX: -1.8 }, { scaleY: 1.8 }],
  },
  butterfly: {
    position: 'absolute',
    alignSelf: 'center',
    top: 28,
    left: 150,
    width: 36,
    height: 96,
    opacity: 0.96,
    transform: [{ scaleX: -1 }],
    filter: 'drop-shadow(0px 0px 20px rgba(255, 155, 215, 1))',
  },
});
