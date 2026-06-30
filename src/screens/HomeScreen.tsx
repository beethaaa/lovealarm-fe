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
  Dimensions,
} from 'react-native';
import { useLoveAlarm, ScanResult } from '@hooks/useLoveAlarm';
import messaging from '@react-native-firebase/messaging';
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
import CoupleScreen from './CoupleScreen';
import { getFcmToken, requestUserPermission } from '@/services/notifService';

const TYPEWRITER_TEXT = 'Are you crushing on anyone...';
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const SCENE_HEIGHT = Math.max(SCREEN_HEIGHT, 820);

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

const assets = {
  sync: require('../assets/sync.webp'),
  button: require('../assets/button.webp'),
  light: require('../assets/light.webp'),
  table: require('../assets/table.webp'),
  cloud: require('../assets/cloud.webp'),
  butterfly: require('../assets/butterfly_light.webp'),
  openButton: require('../assets/button.webp'),
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
    const unsubscribe = messaging().onMessage(async remoteMessage => {
      console.log('Foreground message:', remoteMessage);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    // init for fcm notification
    const init = async () => {
      await requestUserPermission();
      await getFcmToken();
    };

    init();
  }, []);

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
      const partnerId = selectedUser.userId;

      const conv = await chatService.getOrCreateConversation(
        currentId,
        partnerId,
      );
      const conversationId =
        conv?._id ||
        conv?.id ||
        conv?.conversation?._id ||
        conv?.conversation?.id ||
        conv?.data?._id ||
        conv?.data?.id;

      if (!conversationId) {
        throw new Error('Failed to identify conversation session');
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
          _id: selectedUser.userId,
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
          const res = await chatService.getOrCreateConversation(
            currentId,
            partnerId,
          );
          conversationId =
            res?._id || res?.id || res?.data?._id || res?.data?.id;
        } catch (err) {
          console.error('[HomeScreen] Error ensuring conversation exists', err);
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
          _id: partnerId,
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
          _id: partnerId,
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

  if (currentUser?.mode === 2) {
    return <CoupleScreen />;
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#020001" />
      <LinearGradient
        colors={['#000000', '#030002', '#110511', '#1f071d']}
        locations={[0, 0.45, 0.78, 1]}
        style={StyleSheet.absoluteFillObject}
      />

      <View pointerEvents="none" style={styles.backgroundAssets}>
           <Image
          source={assets.butterfly}
          style={styles.butterflyTop}
          resizeMode="contain"
        />
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
          style={styles.butterflyBottom}
          resizeMode="contain"
        />
        <Image
          source={assets.light}
          style={styles.lantern}
          resizeMode="contain"
        />
      </View>

      <ScrollView
        style={styles.contentLayer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {showBanner ? (
          <Animated.View style={[styles.header, { opacity: bannerOpacity }]}>
            <TouchableOpacity
              disabled={loveRequests.length === 0}
              onPress={() => setReceivedModalVisible(true)}
              style={[
                styles.openButtonFrame,
                !isBluetoothOn && styles.disabledButton,
              ]}
            >
              <View pointerEvents="none" style={styles.openButtonImageLayer}>
                <Image
                  source={assets.openButton}
                  style={styles.openButtonAsset}
                  resizeMode="contain"
                />
              </View>
              <View style={styles.openButtonContent}>
                <Text style={[styles.openButtonText, styles.openButtonContent]}>
                  {displayedText}
                </Text>
              </View>
            </TouchableOpacity>
          </Animated.View>
        ) : (
          <TouchableOpacity
            style={[
              styles.openButtonFrame,
              !isBluetoothOn && styles.disabledButton,
            ]}
            onPress={() => {}}
            activeOpacity={0.88}
          >
            <View pointerEvents="none" style={styles.openButtonImageLayer}>
              <Image
                source={assets.openButton}
                style={styles.openButtonAsset}
                resizeMode="contain"
              />
            </View>
            <View style={styles.openButtonContent}>
              <Text style={[styles.openButtonText, styles.openButtonContent]}>
                Bluetooth is {isBluetoothOn ? 'active' : 'offline'}
              </Text>
            </View>
          </TouchableOpacity>
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
                  color={COLOR_PALETTE.pink}
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
              _id: currentUser._id || currentUser.userId,
              name: currentUser.profile?.name || currentUser.name || 'Me',
              avatarUrl:
                currentUser.profile?.avatarUrl || currentUser.avatarUrl,
            }}
            targetUser={{
              _id: selectedUser.userId,
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
    backgroundColor: '#020001',
    overflow: 'hidden',
  },
  backgroundAssets: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
  },
  contentLayer: {
    zIndex: 2,
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
    borderWidth: 1,
    backgroundColor: 'black',
    borderColor: COLOR_PALETTE.cherryBlossomPink,
    filter: 'drop-shadow(0px 0px 20px rgba(255, 155, 215, 1))',
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
  openButtonFrame: {
    width: 300,
    height: 85,
    marginTop: 80,
    alignSelf: 'center',
    zIndex: 8,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
  },
  openButtonImageLayer: {
    width: '100%',
    height: '100%',
    zIndex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  openButtonContent: {
    position: 'absolute',
    zIndex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  openButtonText: {
    color: '#934564',
    fontSize: 16,
    fontFamily: 'serif',
    fontWeight: 'bold',
    textAlign: 'center',
    transform: [{ translateY: -10 }],
  },
  disabledButton: {
    opacity: 0.75,
  },
  openButtonAsset: {
    width: '100%',
    height: '100%',
    zIndex: 1,
    transform: [{ scale: 1.5 }, { translateY: -6 }],
  },
  cloudLeft: {
    position: 'absolute',
    left: -40,
    bottom: -20,
    width: Math.min(SCREEN_WIDTH * 0.8, 520),
    height: 220,
    opacity: 0.2,
    zIndex: 1,
    transform: [{ scale: 2 }],
  },
  cloudRight: {
    position: 'absolute',
    right: -40,
    bottom: -30,
    width: Math.min(SCREEN_WIDTH * 0.5, 520),
    height: 220,
    opacity: 0.4,
    zIndex: 2,
    transform: [{ scaleX: -2 }, { scaleY: 2 }],
  },
  table: {
    position: 'absolute',
    left: -22,
    bottom: -10,
    width: Math.min(SCREEN_WIDTH * 0.62, 390),
    height: Math.min(SCREEN_WIDTH * 0.34, 220),
    zIndex: 2,
    transform: [{ scale: 2.4 }],
  },
  butterflyBottom: {
    position: 'absolute',
    right: Math.max(24, SCREEN_WIDTH * 0.1),
    bottom: Math.max(158, SCENE_HEIGHT * 0.18),
    width: Math.min(SCREEN_WIDTH * 0.12, 70),
    height: Math.min(SCREEN_WIDTH * 0.12, 70),
    zIndex: 3,
    transform: [{ scaleX: -1 }],
    filter: 'drop-shadow(0px 0px 10px rgba(255, 155, 215, 1))',
  },
  butterflyTop: {
    position: 'absolute',
    left: Math.max(24, SCREEN_WIDTH * 0.1),
    top: Math.max(158, SCENE_HEIGHT * 0.2),
    width: Math.min(SCREEN_WIDTH * 0.12, 70),
    height: Math.min(SCREEN_WIDTH * 0.12, 70),
    zIndex: 3,
    filter: 'drop-shadow(0px 0px 10px rgba(255, 155, 215, 1))',
  },
  lantern: {
    position: 'absolute',
    top: Math.max(150, SCENE_HEIGHT * 0.15),
    right: Math.max(20, SCREEN_WIDTH * 0.12),
    width: Math.min(SCREEN_WIDTH * 0.2, 118),
    height: Math.min(SCREEN_WIDTH * 0.32, 178),
    zIndex: 3,
    transform: [{ scale: 2 }],
    filter: 'drop-shadow(0px 0px 20px rgba(255, 155, 215, 1))',
  },
});
