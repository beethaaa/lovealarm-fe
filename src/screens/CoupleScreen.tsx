import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Image,
  Dimensions,
  StatusBar,
} from 'react-native';
import COLOR_PALETTE from '../styles/colorPalette';
import Icon from 'react-native-vector-icons/Ionicons';
import { useAppStore } from '../store/appStore';
import { coupleService } from '../services/coupleService';

const { width: SW, height: SH } = Dimensions.get('window');

const WISHES = [
  "Nguyệt hạ cộng y nhân ❤️",
  "Hoa khai ngộ kiến nhĩ ✨",
  "Tình thâm tự hải trường 🌟",
  "Luôn thấu hiểu nhau! 😉",
  "Nhịp đập yêu thương! 💓",
  "Cùng nhau đi muôn nơi! 🌍",
];

const PulseRing = ({ delay, size }: { delay: number; size: number }) => {
  const scale = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(scale, {
            toValue: 1,
            duration: 2400,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0,
            duration: 2400,
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
          textShadowOffset: { width: 0, height: 0 }
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
  const beat = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const fetchCoupleInfo = async () => {
      try {
        const res = await coupleService.getCoupleInfo();
        console.log('[CoupleScreen] API Response:', JSON.stringify(res));
        // New extraction logic: res.days and res.partner
        setPartner(res.partner);
        setDays(res.days || 0);
      } catch (err) {
        console.error('[CoupleScreen] Failed to fetch couple info:', err);
      } finally {
        setLoading(false);
      }
    };

    // Pick a random wish once on mount
    const wish = WISHES[Math.floor(Math.random() * WISHES.length)];
    setRandomWish(wish);

    fetchCoupleInfo();
  }, []);

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(beat, {
          toValue: 1.25,
          duration: 160,
          useNativeDriver: true,
        }),
        Animated.timing(beat, {
          toValue: 0.9,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(beat, {
          toValue: 1.15,
          duration: 120,
          useNativeDriver: true,
        }),
        Animated.timing(beat, {
          toValue: 1.0,
          duration: 280,
          useNativeDriver: true,
        }),
        Animated.delay(850),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, [beat]);

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
  const partnerName = partner?.profile?.name || partner?.username || partner?.name || 'Partner';

  const defaultAvatar = 'https://i.pinimg.com/736x/8f/11/49/8f114947963d7e5d8a8a2a8a2a8a2a8a.jpg';

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Top Notification Wish Banner */}
      <View style={styles.topBanner}>
        <View style={styles.bannerContent}>
          <Icon name="radio-outline" size={18} color={COLOR_PALETTE.pink} style={{ marginRight: 10 }} />
          <Text style={styles.bannerText}>{randomWish}</Text>
        </View>
      </View>

      <View style={styles.radarSection}>
        <PulseRing delay={0} size={SW * 1.0} />
        <PulseRing delay={480} size={SW * 1.0} />
        <PulseRing delay={960} size={SW * 1.0} />
        <PulseRing delay={1440} size={SW * 1.0} />
        <PulseRing delay={1920} size={SW * 1.0} />

        <View style={styles.centerCircle}>
          <Animated.View style={{ transform: [{ scale: beat }], alignItems: 'center' }}>
            {/* Days couple */}
            <Text style={styles.daysNumber}>{days}</Text>
            <Text style={styles.daysLabel}>Days</Text>
          </Animated.View>
        </View>

        {/* Self */}
        <View style={[styles.avatarWrapper, styles.userA]}>
          <Text style={styles.userName}>{selfName}</Text>
          <View style={styles.avatarBorder}>
            <Image
              source={{ uri: selfAvatar || defaultAvatar }}
              style={styles.avatar}
            />
          </View>
        </View>

        {/* Partner */}
        <View style={[styles.avatarWrapper, styles.userB]}>
          <Text style={styles.userName}>{partnerName}</Text>
          <View style={styles.avatarBorder}>
            <Image
              source={{ uri: partnerAvatar || defaultAvatar }}
              style={styles.avatar}
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
    </View>
  );
};

export default CoupleScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
    alignItems: 'center',
  },
  topBanner: {
    position: 'absolute',
    top: 70,
    left: 45,
    right: 45,
    zIndex: 10,
    backgroundColor: 'rgba(10, 10, 10, 0.95)',
    borderRadius: 24,
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 194, 209, 0.1)',
    borderTopWidth: 3,
    shadowColor: COLOR_PALETTE.pink,
    shadowOffset: { width: 0, height: -2 }, // Slight upward offset for top thickness
    shadowOpacity: 0.4,
    shadowRadius: 15,
    elevation: 8,
  },
  bannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  radarSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  pulseRing: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: 'rgba(255, 194, 209, 0.6)',
  },
  centerCircle: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    width: 220, // Slightly larger to accommodate text
    height: 220,
    borderRadius: 110,
    backgroundColor: '#000000',
    borderWidth: 2,
    borderColor: 'rgba(255, 194, 209, 0.4)',
  },
  daysNumber: {
    fontSize: 64,
    fontWeight: '900',
    color: COLOR_PALETTE.cherryBlossomPink,
    marginTop: -5,
    textShadowColor: COLOR_PALETTE.pink,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 15,
  },
  daysLabel: {
    fontSize: 16,
    color: 'rgba(255,194,209,0.8)',
    fontWeight: '600',
    marginTop: -5,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  avatarWrapper: {
    position: 'absolute',
    alignItems: 'center',
  },
  userA: {
    left: SW * 0.08,
    top: '41.5%',
  },
  userB: {
    right: SW * 0.08,
    top: '41.5%',
  },
  userName: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  avatarBorder: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 2.5,
    borderColor: 'rgba(255,194,209,0.7)',
    padding: 2,
    overflow: 'hidden',
    backgroundColor: '#17050A',
  },
  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: 36,
  },
});
