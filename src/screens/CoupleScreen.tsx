import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Image,
  Dimensions,
  StatusBar,
  Modal,
  TouchableOpacity,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import COLOR_PALETTE from '../styles/colorPalette';
import Icon from 'react-native-vector-icons/Ionicons';
import { useAppStore } from '../store/appStore';
import { coupleService } from '../services/coupleService';

const { width: SW, height: SH } = Dimensions.get('window');
const SCENE_HEIGHT = Math.max(SH, 820);

const WISHES = [
  'Two hearts, one signal',
  'Let the magic begin',
  'A new love story begins',
  'Your love signal has arrived',
  'A little spark, a beautiful start',
];

const assets = {
  button: require('../assets/button.webp'),
  book: require('../assets/book.webp'),
  syncButton: require('../assets/sync_button.webp'),
  castle: require('../assets/castle.webp'),
  cloud: require('../assets/cloud.webp'),
  butterfly: require('../assets/butterfly_light.webp'),
};

const PulseRing = ({ delay, size }: { delay: number; size: number }) => {
  const scale = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0.78)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(scale, {
            toValue: 1,
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
            toValue: 0.78,
            duration: 0,
            useNativeDriver: true,
          }),
        ]),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [scale, opacity, delay]);

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

const BookSparkle = ({
  delay,
  size = 16,
  style,
}: {
  delay: number;
  size?: number;
  style: any;
}) => {
  const opacity = useRef(new Animated.Value(0.25)).current;
  const scale = useRef(new Animated.Value(0.7)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(opacity, {
            toValue: 1,
            duration: 520,
            useNativeDriver: true,
          }),
          Animated.timing(scale, {
            toValue: 1.18,
            duration: 520,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(opacity, {
            toValue: 0.2,
            duration: 620,
            useNativeDriver: true,
          }),
          Animated.timing(scale, {
            toValue: 0.72,
            duration: 620,
            useNativeDriver: true,
          }),
        ]),
        Animated.delay(420),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [delay, opacity, scale]);

  return (
    <Animated.View
      style={[styles.bookSparkle, style, { opacity, transform: [{ scale }] }]}
    >
      <Icon name="sparkles" size={size} color="#FFE0EA" />
    </Animated.View>
  );
};

const FloatingHeart = ({ onComplete }: { onComplete: () => void }) => {
  const posY = useRef(new Animated.Value(0)).current;
  // randomized starting horizontal position for "wide spawn"
  const startX = (Math.random() - 0.5) * 120;
  const posX = useRef(new Animated.Value(startX)).current;
  const opacity = useRef(new Animated.Value(0.8)).current; // Slightly lower initial opacity
  const scale = useRef(new Animated.Value(Math.random() * 1.5 + 0.8)).current; // Much larger base hearts

  // Wider and higher spread trajectory
  const targetX = (Math.random() - 0.5) * SW * 2.0;
  const targetY = -(Math.random() * SH * 0.9 + SH * 0.15);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(posY, {
        toValue: targetY,
        duration: 3500,
        useNativeDriver: true,
      }),
      Animated.timing(posX, {
        toValue: targetX,
        duration: 3500,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 3500,
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 5, // Grow significantly for impact
        duration: 3500,
        useNativeDriver: true,
      }),
    ]).start(() => onComplete());
  }, []);

  return (
    <Animated.View
      style={{
        position: 'absolute',
        bottom: 120,
        opacity,
        transform: [{ translateY: posY }, { translateX: posX }, { scale }],
      }}
    >
      <Icon
        name="heart"
        size={36}
        color={COLOR_PALETTE.pink}
        style={{
          textShadowColor: 'rgba(255, 136, 170, 0.6)', // Reduced from 0.9
          textShadowRadius: 8, // Reduced from 15
          textShadowOffset: { width: 0, height: 0 },
        }}
      />
    </Animated.View>
  );
};

const CoupleScreen = () => {
  const { user: currentUser, heartTrigger } = useAppStore();
  const [partner, setPartner] = useState<any>(null);
  const [days, setDays] = useState<number>(0);
  const [randomWish, setRandomWish] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [hearts, setHearts] = useState<{ id: number }[]>([]);
  const [showPartnerProfile, setShowPartnerProfile] = useState(false);
  const daysFade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const fetchCoupleInfo = async () => {
      try {
        const res = await coupleService.getCoupleInfo();
        console.log('[CoupleScreen] API Response:', JSON.stringify(res));
        setPartner(res.partner);
        setDays(res.days || 0);
      } catch (err) {
        console.error('[CoupleScreen] Failed to fetch couple info:', err);
      } finally {
        setLoading(false);
      }
    };

    const wish = WISHES[Math.floor(Math.random() * WISHES.length)];
    setRandomWish(wish);

    fetchCoupleInfo();
  }, []);

  useEffect(() => {
    if (loading) return;
    daysFade.setValue(0);
    Animated.timing(daysFade, {
      toValue: 1,
      duration: 680,
      useNativeDriver: true,
    }).start();
  }, [days, daysFade, loading]);

  useEffect(() => {
    if (heartTrigger > 0) {
      spawnHearts(8);
    }
  }, [heartTrigger]);

  const spawnHearts = (count: number) => {
    const newHearts = Array.from({ length: count }).map(() => ({
      id: Math.random() + Date.now(),
    }));
    setHearts(prev => [...prev, ...newHearts]);
  };

  const removeHeart = (id: number) => {
    setHearts(prev => prev.filter(h => h.id !== id));
  };

  const selfAvatar = currentUser?.avatarUrl || currentUser?.profile?.avatarUrl;
  const selfName = currentUser?.profile?.name || currentUser?.name || 'Me';

  const partnerAvatar = partner?.avatarUrl || partner?.profile?.avatarUrl;
  const partnerName =
    partner?.profile?.name || partner?.username || partner?.name || 'Partner';

  const defaultAvatar =
    'https://i.pinimg.com/736x/8f/11/49/8f114947963d7e5d8a8a2a8a2a8a2a8a.jpg';

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
          source={assets.castle}
          style={styles.castle}
          resizeMode="contain"
        />
      </View>

      <View style={styles.contentLayer}>
        <View style={styles.topBanner}>
          <Image
            source={assets.button}
            style={styles.bannerAsset}
            resizeMode="stretch"
          />
          <View style={styles.bannerContent}>
            <Text style={styles.bannerText} numberOfLines={1}>
              {randomWish || 'Couple signal online'}
            </Text>
          </View>
        </View>

        <View style={styles.radarSection}>
          <TouchableOpacity
            activeOpacity={0.9}
            style={[styles.avatarWrapper, styles.userA]}
          >
            <View style={styles.avatarStack}>
              <Image
                source={assets.syncButton}
                style={styles.syncButton}
                resizeMode="contain"
              />
              <LinearGradient
                colors={['#FFF6E4', COLOR_PALETTE.pink, COLOR_PALETTE.roseRed]}
                style={styles.avatarBorder}
              >
                <Image
                  source={{ uri: selfAvatar || defaultAvatar }}
                  style={styles.avatar}
                />
              </LinearGradient>
            </View>
            <Text style={styles.userName} numberOfLines={1}>
              {selfName}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => setShowPartnerProfile(true)}
            style={[styles.avatarWrapper, styles.userB]}
          >
            <View style={styles.avatarStack}>
              <Image
                source={assets.syncButton}
                style={styles.syncButton}
                resizeMode="contain"
              />
              <LinearGradient
                colors={['#FFF6E4', COLOR_PALETTE.pink, COLOR_PALETTE.roseRed]}
                style={styles.avatarBorder}
              >
                <Image
                  source={{ uri: partnerAvatar || defaultAvatar }}
                  style={styles.avatar}
                />
              </LinearGradient>
            </View>
            <Text style={styles.userName} numberOfLines={1}>
              {partnerName}
            </Text>
          </TouchableOpacity>

          <Animated.View
            style={[
              styles.centerCircle,
              {
                opacity: daysFade,
                transform: [
                  {
                    translateY: daysFade.interpolate({
                      inputRange: [0, 1],
                      outputRange: [-68, -82],
                    }),
                  },
                ],
              },
            ]}
          >
            <Text style={styles.daysNumber}>{loading ? '--' : days}</Text>
            <Text style={styles.daysLabel}>days</Text>
          </Animated.View>

          <View pointerEvents="none" style={styles.bookStage}>
            <BookSparkle delay={0} size={17} style={styles.bookSparkleOne} />
            <BookSparkle delay={380} size={12} style={styles.bookSparkleTwo} />
            <BookSparkle
              delay={760}
              size={14}
              style={styles.bookSparkleThree}
            />
            <Image
              source={assets.book}
              style={styles.book}
              resizeMode="contain"
            />
          </View>
        </View>
      </View>

      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <View style={{ flex: 1, alignItems: 'center' }}>
          {hearts.map(h => (
            <FloatingHeart key={h.id} onComplete={() => removeHeart(h.id)} />
          ))}
        </View>
      </View>

      <Modal
        visible={showPartnerProfile}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPartnerProfile(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setShowPartnerProfile(false)}
          />
          <View style={styles.modalContainer}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowPartnerProfile(false)}
            >
              <Icon name="close" size={22} color={COLOR_PALETTE.pink} />
            </TouchableOpacity>

            <View style={styles.modalHeader}>
              <LinearGradient
                colors={['#FFF6E4', COLOR_PALETTE.pink, COLOR_PALETTE.roseRed]}
                style={styles.modalAvatarBorder}
              >
                <Image
                  source={{ uri: partnerAvatar || defaultAvatar }}
                  style={styles.modalAvatar}
                />
              </LinearGradient>
              <Text style={styles.modalName}>{partnerName}</Text>
              <View style={styles.genderBadge}>
                <Icon
                  name={partner?.profile?.gender === 1 ? 'female' : 'male'}
                  size={14}
                  color={COLOR_PALETTE.roseRed}
                />
                <Text style={styles.genderText}>
                  {partner?.profile?.gender === 1 ? 'Female' : 'Male'}
                </Text>
              </View>
            </View>

            <View style={styles.modalBody}>
              <View style={styles.infoRow}>
                <Icon
                  name="calendar-outline"
                  size={18}
                  color="rgba(255, 226, 234, 0.62)"
                />
                <Text style={styles.infoText}>
                  {partner?.profile?.birthday || '---'}
                </Text>
              </View>

              <View style={styles.tagSection}>
                <Text style={styles.sectionLabel}>So thich & tinh cach</Text>
                <View style={styles.tagWrapper}>
                  {[
                    ...(partner?.profile?.interest || []),
                    ...(partner?.profile?.personalityTags || []),
                  ].map((tag: string, idx: number) => (
                    <View key={idx} style={styles.tagItem}>
                      <Text style={styles.tagText}>{tag}</Text>
                    </View>
                  ))}
                  {!partner?.profile?.interest?.length &&
                    !partner?.profile?.personalityTags?.length && (
                      <Text style={styles.emptyText}>Chua co thong tin</Text>
                    )}
                </View>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default CoupleScreen;

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
  topBanner: {
    width: 312,
    height: 88,
    marginTop: 78,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
    zIndex: 8,
  },
  bannerAsset: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    transform: [{ scale: 1.3 }, { translateY: -5 }],
  },
  bannerContent: {
    maxWidth: 300,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    transform: [{ translateY: -10 }],
  },
  bannerText: {
    color: '#934564',
    fontSize: 16,
    fontFamily: 'serif',
    fontWeight: 'bold',
    textAlign: 'center',
    transform: [{ translateY: 2 }],
  },
  radarSection: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseRing: {
    position: 'absolute',
    borderWidth: 1,
    borderColor: COLOR_PALETTE.cherryBlossomPink,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    shadowColor: COLOR_PALETTE.pink,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 18,
  },
  connectionLine: {
    position: 'absolute',
    width: Math.min(SW * 0.58, 250),
    height: 1,
    backgroundColor: 'rgba(255, 194, 209, 0.24)',
    transform: [{ translateY: -82 }],
  },
  connectionHeart: {
    position: 'absolute',
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(12, 2, 8, 0.84)',
    borderWidth: 1,
    borderColor: 'rgba(255, 194, 209, 0.34)',
    shadowColor: COLOR_PALETTE.pink,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.55,
    shadowRadius: 16,
    transform: [{ translateY: -82 }],
  },
  centerCircle: {
    width: 168,
    height: 168,
    borderRadius: 84,
    alignItems: 'center',
    justifyContent: 'center',
  },
  daysNumber: {
    color: '#FFF4F7',
    fontSize: 56,
    fontWeight: '900',
    lineHeight: 62,
    textShadowColor: COLOR_PALETTE.roseRed,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 16,
  },
  daysLabel: {
    color: COLOR_PALETTE.pink,
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  avatarWrapper: {
    position: 'absolute',
    alignItems: 'center',
    width: 112,
    zIndex: 4,
    transform: [{ translateY: -62 }],
  },
  userA: {
    left: Math.max(14, SW * 0.05),
  },
  userB: {
    right: Math.max(14, SW * 0.05),
  },
  userName: {
    color: '#FFF4F7',
    fontSize: 13,
    fontWeight: '900',
    marginTop: 8,
    maxWidth: 108,
    textAlign: 'center',
    textShadowColor: COLOR_PALETTE.roseRed,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  avatarStack: {
    width: 108,
    height: 104,
    alignItems: 'center',
    justifyContent: 'center',
  },
  syncButton: {
    position: 'absolute',
    width: 126,
    height: 126,
    opacity: 0.92,
    transform: [{ translateY: 1 }],
  },
  avatarBorder: {
    width: 78,
    height: 78,
    borderRadius: 39,
    shadowColor: COLOR_PALETTE.pink,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.65,
    shadowRadius: 12,
    elevation: 10,
  },
  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: 55,
    transform: [{ translateY: 2 }],
    filter: 'drop-shadow(0px 0px 10px rgba(255, 100, 155, 1))',
  },
  heartLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 6,
    alignItems: 'center',
  },
  floatingHeart: {
    position: 'absolute',
    bottom: 120,
    shadowColor: COLOR_PALETTE.pink,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: SW * 0.86,
    backgroundColor: '#12030B',
    borderRadius: 26,
    borderWidth: 1,
    borderColor: 'rgba(255, 194, 209, 0.28)',
    padding: 24,
    alignItems: 'center',
    shadowColor: COLOR_PALETTE.pink,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.26,
    shadowRadius: 20,
    elevation: 12,
  },
  closeButton: {
    position: 'absolute',
    top: 18,
    right: 18,
    zIndex: 10,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255, 194, 209, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 194, 209, 0.18)',
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  modalAvatarBorder: {
    width: 118,
    height: 118,
    borderRadius: 59,
    padding: 4,
    marginBottom: 16,
  },
  modalAvatar: {
    width: '100%',
    height: '100%',
    borderRadius: 55,
    borderWidth: 2,
    borderColor: '#070104',
  },
  modalName: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFF4F7',
    textAlign: 'center',
  },
  genderBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLOR_PALETTE.mimiPink,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    marginTop: 8,
    gap: 6,
  },
  genderText: {
    color: COLOR_PALETTE.roseRed,
    fontSize: 12,
    fontWeight: '900',
  },
  modalBody: {
    width: '100%',
    gap: 20,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  infoText: {
    color: 'rgba(255, 226, 234, 0.76)',
    fontSize: 16,
    fontWeight: '600',
  },
  tagSection: {
    width: '100%',
  },
  sectionLabel: {
    color: '#FFF4F7',
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 12,
    textAlign: 'center',
  },
  tagWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  tagItem: {
    backgroundColor: 'rgba(255, 194, 209, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 194, 209, 0.18)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 18,
  },
  tagText: {
    color: 'rgba(255, 226, 234, 0.86)',
    fontSize: 12,
    fontWeight: '700',
  },
  emptyText: {
    color: 'rgba(255, 226, 234, 0.42)',
    fontSize: 12,
    fontStyle: 'italic',
  },
  cloudLeft: {
    position: 'absolute',
    left: -120,
    bottom: -40,
    width: Math.min(SW * 0.8, 520),
    height: 220,
    opacity: 0.6,
    zIndex: 1,
    transform: [{ scale: 1.5 }],
  },
  cloudRight: {
    position: 'absolute',
    right: -40,
    bottom: -30,
    width: Math.min(SW * 0.5, 520),
    height: 220,
    opacity: 0.4,
    zIndex: 2,
    transform: [{ scaleX: -2 }, { scaleY: 2 }],
  },
  butterflyBottom: {
    position: 'absolute',
    right: Math.max(24, SW * 0.1),
    bottom: Math.max(158, SCENE_HEIGHT * 0.18),
    width: Math.min(SW * 0.12, 70),
    height: Math.min(SW * 0.12, 70),
    zIndex: 3,
    transform: [{ scaleX: -1 }],
    filter: 'drop-shadow(0px 0px 20px rgba(255, 155, 215, 1))',
  },
  butterflyTop: {
    position: 'absolute',
    left: Math.max(24, SW * 0.1),
    bottom: Math.max(158, SCENE_HEIGHT * 0.3),
    width: Math.min(SW * 0.12, 70),
    height: Math.min(SW * 0.12, 70),
    zIndex: 3,
    filter: 'drop-shadow(0px 0px 20px rgba(255, 155, 215, 1))',
  },
  castle: {
    position: 'absolute',
    bottom: -20,
    width: Math.min(SW, 620),
    height: Math.min(SW, 620),
    zIndex: -1,
    opacity: 0.2,
  },
  bookStage: {
    position: 'absolute',
    width: Math.min(SW * 0.54, 210),
    height: 108,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ translateX: 6 }],
    zIndex: 5,
  },
  book: {
    width: Math.min(SW * 0.48, 188),
    height: 128,
    zIndex: 2,
    transform: [{ rotate: '-4deg' }],
    filter: 'drop-shadow(0px -10px 30px rgba(255, 155, 215, 0.8))',
  },
  bookSparkle: {
    position: 'absolute',
    zIndex: 4,
    shadowColor: COLOR_PALETTE.pink,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
  },
  bookSparkleOne: {
    left: '15%',
    top: 18,
  },
  bookSparkleTwo: {
    right: '20%',
    top: 26,
  },
  bookSparkleThree: {
    left: '48%',
    bottom: 22,
  },
});
