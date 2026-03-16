import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  Animated,
  StatusBar,
  StyleSheet,
  Image,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useLoveAlarm, ScanResult } from '@hooks/useLoveAlarm';
import COLOR_PALETTE from '@/styles/colorPalette';
import Icon from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import { State } from 'react-native-ble-plx';
import { useSocket } from '@/context/SocketContext';
import LoveRequestModal from '@/components/LoveRequestModal';
import ReceivedRequestsModal from '@/components/ReceivedRequestsModal';
import { loveRequestService } from '@/services/loveRequestService';
import { chatService } from '@/services/chatService';
import { userService } from '@/services/userService';
import { useAppStore } from '@/store/appStore';
import { useNavigation } from '@react-navigation/native';

const TYPEWRITER_TEXT = 'Are you crushing on anyone...';

const COLORS = {
  bg: '#0A0A0A',
  surface: '#17050A',
  border: '#3D0E1E',
  primary: COLOR_PALETTE.brightPink,
  primaryLight: COLOR_PALETTE.pink,
  primaryDark: COLOR_PALETTE.roseRed,
  textPrimary: '#FFFFFF',
  textSecondary: COLOR_PALETTE.cherryBlossomPink,
  textMuted: COLOR_PALETTE.amaranthPink,
  green: '#22c55e',
  red: '#ef4444',
};

const PulseRing = ({
  delay = 0,
  isActive,
  size = 240,
  staticOpacity = 0.25,
}: {
  delay?: number;
  isActive: boolean;
  size?: number;
  staticOpacity?: number;
}) => {
  const scale = React.useRef(new Animated.Value(1)).current;
  const opacity = React.useRef(new Animated.Value(staticOpacity)).current;
  const animRef = React.useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    if (animRef.current) {
      animRef.current.stop();
      animRef.current = null;
    }

    if (!isActive) {
      const staticAnim = Animated.parallel([
        Animated.timing(scale, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: staticOpacity,
          duration: 400,
          useNativeDriver: true,
        }),
      ]);
      animRef.current = staticAnim;
      staticAnim.start(() => {
        animRef.current = null;
      });
      return;
    }

    scale.setValue(0);
    opacity.setValue(0.8);

    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(scale, {
            toValue: 1.5,
            duration: 2500,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0,
            duration: 2500,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(scale, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0.8,
            duration: 0,
            useNativeDriver: true,
          }),
        ]),
      ]),
    );
    animRef.current = loop;
    loop.start();

    return () => {
      animRef.current?.stop();
      animRef.current = null;
    };
  }, [isActive, delay, scale, opacity, staticOpacity]);

  return (
    <Animated.View
      style={[
        styles.pulseRing,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          opacity,
          transform: [{ scale }],
        },
      ]}
    />
  );
};

interface HomeScreenProps {
  isScanning?: boolean;
  startLoveAlarm?: () => void;
  stopLoveAlarm?: () => void;
  nearbyUsers?: ScanResult[];
}

const HomeScreen = (props: HomeScreenProps) => {
  const {
    isScanning: isScanningHook,
    nearbyUsers: nearbyUsersHook,
    bluetoothState,
  } = useLoveAlarm();

  const isScanning = props.isScanning ?? isScanningHook;
  const nearbyUsers = props.nearbyUsers ?? nearbyUsersHook;

  const heartScale = React.useRef(new Animated.Value(1)).current;
  const { emit } = useSocket();

  const [displayedText, setDisplayedText] = useState('');
  const [showBanner, setShowBanner] = useState(false);
  const [receivedModalVisible, setReceivedModalVisible] = useState(false);
  const bannerOpacity = useRef(new Animated.Value(0)).current;
  const typewriterRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const charIndexRef = useRef(0);
  const navigation = useNavigation<any>();

  const {
    user: currentUser,
    setUser: setCurrentUser,
    loveRequests,
    setLoveRequests,
    setActiveTab,
  } = useAppStore();
  const [selectedUser, setSelectedUser] = useState<ScanResult | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [_isSending, setIsSending] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      const hasId = currentUser?._id;
      if (!currentUser || !hasId) {
        try {
          const res = await userService.getProfile();
          const userData =
            res.data?.user && typeof res.data.user === 'object'
              ? res.data.user
              : res.data?.data?.user && typeof res.data.data.user === 'object'
              ? res.data.data.user
              : res.user && typeof res.user === 'object'
              ? res.user
              : res.data &&
                typeof res.data === 'object' &&
                (res.data._id || res.data.id)
              ? res.data
              : res && typeof res === 'object' && (res._id || res.id)
              ? res
              : null;

          if (userData && (userData._id || userData.id || userData.userId)) {
            await setCurrentUser(userData);
          } else {
            console.error(
              '[HomeScreen] Could not find user object in profile response:',
              JSON.stringify(res),
            );
          }
        } catch (error) {
          console.error('[HomeScreen] Failed to fetch profile:', error);
        }
      }
    };
    fetchProfile();
  }, [currentUser, setCurrentUser]);

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const res = await loveRequestService.getLoveRequests();
        setLoveRequests(res.data || res || []);
      } catch (error) {
        console.error('[HomeScreen] Failed to fetch requests:', error);
      }
    };
    if (currentUser) {
      fetchRequests();
    }
  }, [currentUser, setLoveRequests]);

  const handleUserPress = (user: ScanResult) => {
    console.log(
      '[HomeScreen] User Bubble Pressed. Current User State:',
      JSON.stringify(currentUser),
    );
    setSelectedUser(user);
    setModalVisible(true);
  };

  const handleSendLoveRequest = async () => {
    if (!selectedUser || !currentUser) return;
    setIsSending(true);
    try {
      // Create conversation via API POST as requested
      const currentId = currentUser._id || currentUser.id || currentUser.userId;
      const participants = [currentId, selectedUser.userId].sort();
      const conv = await chatService.createConversation(participants);
      const conversationId =
        conv?._id ||
        conv?.id ||
        conv?.conversation?._id ||
        conv?.conversation?.id ||
        conv?.data?._id ||
        conv?.data?.id;

      if (!conversationId) {
        console.warn(
          '[HomeScreen] Failed to extract conversationId from:',
          JSON.stringify(conv),
        );
        throw new Error('Failed to create conversation session');
      }

      await loveRequestService.sendLoveRequest(selectedUser.userId);
      setModalVisible(false);

      // Emit socket event for real-time notification
      emit('love-request:send', {
        toUserId: selectedUser.userId,
        conversationId: conversationId,
      });

      navigation.navigate('Chat', {
        targetUser: {
          id: selectedUser.userId,
          name: selectedUser.name,
          avatarUrl: selectedUser.avatarUrl,
        },
        conversationId: conversationId,
      });
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to send love signal');
    } finally {
      setIsSending(false);
    }
  };

  const handleRequestAccepted = async (partner: any) => {
    try {
      const currentId =
        currentUser?._id || currentUser?.id || currentUser?.userId;
      const partnerId = partner?._id || partner?.id || partner?.userId;

      if (!currentId || !partnerId) {
        console.warn(
          '[HomeScreen] Missing user ID. Current:',
          currentId,
          'Partner:',
          partnerId,
          'Partner Object:',
          JSON.stringify(partner),
        );
        throw new Error('Missing user ID for conversation creation');
      }

      let conversationId = partner.conversationId;

      if (!conversationId) {
        try {
          const allConvsRes = await loveRequestService.getConversations();
          const allConvs = Array.isArray(allConvsRes)
            ? allConvsRes
            : allConvsRes?.data || [];
          const existingConv = allConvs.find((c: any) => {
            const p = c.partner || c.targetUser || c.toUser || {};
            const pId = p.id || p._id || p.userId;
            return pId && pId.toString() === partnerId.toString();
          });

          if (existingConv) {
            console.log(
              '[HomeScreen] Found existing conversation with partner:',
              existingConv.id || existingConv._id,
            );
            conversationId = existingConv.id || existingConv._id;
          } else {
            console.log(
              '[HomeScreen] Creating new conversation array:',
              [currentId, partnerId].sort(),
            );
            const participants = [currentId, partnerId].sort();
            const res = await chatService.createConversation(participants);
            conversationId =
              res?._id || res?.id || res?.data?._id || res?.data?.id;
          }
        } catch (err) {
          console.error(
            '[HomeScreen] Error finding existing conversation',
            err,
          );
        }
      }

      emit('love-request:accepted', {
        toUserId: partnerId,
        partnerName: currentUser?.profile?.name || currentUser?.name,
        conversationId: conversationId,
      });

      setActiveTab('matched');
      navigation.navigate('Chat', {
        targetUser: {
          id: partnerId,
          name: partner.name || partner.username || 'Partner',
          avatarUrl: partner.avatarUrl || partner.profile?.avatarUrl,
        },
        conversationId: conversationId,
        isFirstFriendshipMessage: true,
      });
    } catch (error) {
      console.error('[HomeScreen] Create conversation error:', error);
      const partnerId = partner?._id || partner?.id || partner?.userId;

      setActiveTab('matched');
      navigation.navigate('Chat', {
        targetUser: {
          id: partnerId,
          name: partner.name || partner.username || 'Partner',
          avatarUrl: partner.avatarUrl || partner.profile?.avatarUrl,
        },
        conversationId: 'fallback',
        isFirstFriendshipMessage: true,
      });
    }
  };

  useEffect(() => {
    if (isScanning) {
      charIndexRef.current = 0;
      setDisplayedText('');
      setShowBanner(true);
      bannerOpacity.setValue(0);
      Animated.timing(bannerOpacity, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }).start();

      const type = () => {
        if (loveRequests.length > 0) {
          setDisplayedText(`Có ${loveRequests.length} người đang để ý bạn...`);
          return;
        }
        if (charIndexRef.current <= TYPEWRITER_TEXT.length) {
          setDisplayedText(TYPEWRITER_TEXT.slice(0, charIndexRef.current));
          charIndexRef.current += 1;
          typewriterRef.current = setTimeout(type, 55);
        }
      };
      typewriterRef.current = setTimeout(type, 200);
    } else {
      if (typewriterRef.current) {
        clearTimeout(typewriterRef.current);
        typewriterRef.current = null;
      }
      Animated.timing(bannerOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        setShowBanner(false);
        setDisplayedText('');
        charIndexRef.current = 0;
      });
    }

    return () => {
      if (typewriterRef.current) {
        clearTimeout(typewriterRef.current);
        typewriterRef.current = null;
      }
    };
  }, [isScanning, bannerOpacity, loveRequests.length]);

  useEffect(() => {
    if (!isScanning) {
      heartScale.setValue(1);
      return;
    }
    const beat = Animated.loop(
      Animated.sequence([
        Animated.timing(heartScale, {
          toValue: 1.1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(heartScale, {
          toValue: 1.0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(heartScale, {
          toValue: 1.05,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(heartScale, {
          toValue: 1.0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.delay(600),
      ]),
    );
    beat.start();
    return () => beat.stop();
  }, [isScanning, heartScale]);

  const userPositionsRef = useRef<
    Record<string, { angle: number; ring: number }>
  >({});
  const userOpacitiesRef = useRef<Record<string, Animated.Value>>({});

  useEffect(() => {
    const activeIds = new Set((nearbyUsers || []).map(u => u.userId));

    Object.keys(userPositionsRef.current).forEach(id => {
      if (!activeIds.has(id)) {
        delete userPositionsRef.current[id];
        delete userOpacitiesRef.current[id];
      }
    });

    (nearbyUsers || []).forEach((user, index) => {
      if (!userPositionsRef.current[user.userId]) {
        const ring = index % 3;
        const existing = Object.values(userPositionsRef.current).map(
          p => p.angle,
        );
        let angle = 0;
        let best = -1;
        for (let attempt = 0; attempt < 30; attempt++) {
          const candidate = Math.random() * 2 * Math.PI;
          const minDist = existing.length
            ? Math.min(...existing.map(a => Math.abs(a - candidate)))
            : Infinity;
          if (minDist > best) {
            best = minDist;
            angle = candidate;
          }
        }
        userPositionsRef.current[user.userId] = { angle, ring };

        const opacity = new Animated.Value(0);
        userOpacitiesRef.current[user.userId] = opacity;
        Animated.timing(opacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }).start();
      }
    });
  }, [nearbyUsers]);

  const BUBBLE_SIZE = 48;
  const RADAR_CENTER = 150;
  const RING_RADII = [80, 110, 140];

  const isBluetoothOn = bluetoothState === State.PoweredOn;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {showBanner ? (
          <Animated.View style={[styles.header, { opacity: bannerOpacity }]}>
            <TouchableOpacity
              disabled={loveRequests.length === 0}
              onPress={() => setReceivedModalVisible(true)}
              style={styles.welcomeTextContainer}
            >
              <Icon
                name={
                  loveRequests.length > 0 ? 'heart-circle' : 'radio-outline'
                }
                size={24}
                color={COLOR_PALETTE.pink}
              />
              <Text style={styles.welcomeText}>{displayedText}</Text>
            </TouchableOpacity>
          </Animated.View>
        ) : (
          <View style={styles.bluetoothContainer}>
            <Icon name="bluetooth" size={24} color={COLOR_PALETTE.pink} />
            <Text style={styles.welcomeText}>
              Bluetooth is {isBluetoothOn ? 'active' : 'offline'}
            </Text>
          </View>
        )}

        <View style={styles.radarContainer}>
          <View style={styles.radarInner}>
            <PulseRing
              delay={1600}
              isActive={isScanning}
              size={160}
              staticOpacity={0.65}
            />
            <PulseRing
              delay={800}
              isActive={isScanning}
              size={220}
              staticOpacity={0.45}
            />
            <PulseRing
              delay={0}
              isActive={isScanning}
              size={280}
              staticOpacity={0.2}
            />

            <View
              style={[
                styles.centerCircle,
                isScanning && styles.centerCircleActive,
              ]}
            >
              <Animated.View
                style={[
                  { transform: [{ scale: heartScale }] },
                  styles.heartGlow,
                ]}
              >
                <Icon
                  style={styles.heartIcon}
                  name="heart"
                  size={80}
                  color={COLOR_PALETTE.cherryBlossomPink}
                />
              </Animated.View>
            </View>

            {isScanning &&
              (nearbyUsers || []).map(user => {
                const pos = userPositionsRef.current[user.userId];
                const opacityAnim = userOpacitiesRef.current[user.userId];
                if (!pos || !opacityAnim) return null;

                const radius = RING_RADII[pos.ring];
                const cx =
                  RADAR_CENTER + radius * Math.cos(pos.angle) - BUBBLE_SIZE / 2;
                const cy =
                  RADAR_CENTER + radius * Math.sin(pos.angle) - BUBBLE_SIZE / 2;

                return (
                  <Animated.View
                    key={user.userId}
                    style={[
                      styles.userBubbleWrapper,
                      { left: cx, top: cy, opacity: opacityAnim },
                    ]}
                  >
                    <TouchableOpacity onPress={() => handleUserPress(user)}>
                      <LinearGradient
                        colors={['#FFF6E4', '#FFECC9', '#F6889A']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.userBubbleGradient}
                      >
                        {user.avatarUrl ? (
                          <Image
                            source={{ uri: user.avatarUrl }}
                            style={styles.userBubbleImage}
                          />
                        ) : (
                          <View style={styles.userBubbleFallback}>
                            <Text style={styles.userBubbleInitial}>
                              {user.name?.[0]?.toUpperCase() ?? '?'}
                            </Text>
                          </View>
                        )}
                      </LinearGradient>
                    </TouchableOpacity>
                  </Animated.View>
                );
              })}
          </View>
        </View>
      </ScrollView>

      {currentUser &&
        console.log(
          '[HomeScreen] Passing current user to modal:',
          JSON.stringify(currentUser),
        )}
      {selectedUser &&
        currentUser &&
        (currentUser._id || currentUser.userId) && (
          <LoveRequestModal
            visible={modalVisible}
            onClose={() => setModalVisible(false)}
            onSend={handleSendLoveRequest}
            currentUser={{
              id: currentUser._id || currentUser.userId,
              name: currentUser.profile?.name || currentUser.name || 'Me',
              avatarUrl:
                currentUser.profile?.avatarUrl || currentUser.avatarUrl,
            }}
            targetUser={{
              id: selectedUser.userId,
              name: selectedUser.name,
              avatarUrl: selectedUser.avatarUrl,
            }}
          />
        )}

      <ReceivedRequestsModal
        visible={receivedModalVisible}
        onClose={() => setReceivedModalVisible(false)}
        onRequestAccepted={handleRequestAccepted}
      />
    </View>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 320,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 56,
    paddingBottom: 16,
    alignItems: 'center',
  },
  welcomeTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0A0A0A',
    borderRadius: 16,
    marginTop: 40,
    paddingHorizontal: 24,
    paddingVertical: 14,
    gap: 12,
    boxShadow: 'inset 0px -1px 4px 0px #FFB2C5',
  },
  bluetoothContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0A0A0A',
    borderRadius: 16,
    marginTop: 80,
    paddingHorizontal: 24,
    paddingVertical: 14,
    gap: 12,
    marginLeft: 56,
    marginRight: 56,
    boxShadow: 'inset 0px -1px 4px 0px #FFB2C5',
  },
  welcomeText: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '600',
    textShadowColor: COLORS.primaryDark,
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
  },
  radarContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radarInner: {
    width: 300,
    height: 300,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseRing: {
    position: 'absolute',
    borderWidth: 4,
    borderColor: COLOR_PALETTE.cherryBlossomPink,
  },
  centerCircle: {
    width: 200,
    height: 200,
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerCircleActive: {
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 25,
    elevation: 20,
  },
  heartGlow: {
    shadowColor: COLOR_PALETTE.cherryBlossomPink,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 20,
    elevation: 20,
  },
  heartIcon: {
    textShadowColor: COLOR_PALETTE.cherryBlossomPink,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  userBubbleWrapper: {
    position: 'absolute',
    width: 48,
    height: 48,
    borderRadius: 24,
    shadowColor: COLOR_PALETTE.pink,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 8,
    elevation: 10,
  },
  userBubbleGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 24,
    padding: 3,
  },
  userBubbleImage: {
    width: '100%',
    height: '100%',
    borderRadius: 21,
  },
  userBubbleFallback: {
    width: '100%',
    height: '100%',
    borderRadius: 21,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userBubbleInitial: {
    color: COLOR_PALETTE.amaranthPink,
    fontSize: 18,
    fontWeight: '700',
  },
});
