import React, { useEffect, useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Dimensions,
  StatusBar,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import { useAppStore } from '@/store/appStore';
import { useSocket } from '@/context/SocketContext';
import { coupleService } from '@/services/coupleService';
import { momentService } from '@/services/momentService';
import { chatService } from '@/services/chatService';
import COLOR_PALETTE from '@/styles/colorPalette';

const { width: SW, height: SH } = Dimensions.get('window');

const LoveMomentScreen = () => {
  const navigation = useNavigation<any>();
  const isFocused = useIsFocused();
  const { user: currentUser, setNotification } = useAppStore();
  const { socket } = useSocket();

  const [moments, setMoments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchCurrentMoments = useCallback(async () => {
    try {
      const now = new Date();
      const start = new Date(now);
      start.setMinutes(0, 0, 0);
      start.setMilliseconds(0);
      const end = new Date(now);
      end.setMinutes(59, 59, 999);
      end.setMilliseconds(999);

      const res = await momentService.getCurrentMoments(
        start.toISOString(),
        end.toISOString(),
      );
      setMoments(res.moments || []);
    } catch (error) {
      console.error('Error fetching current moments:', error);
    }
  }, []);

  const fetchAllData = useCallback(async () => {
    try {
      // 1. Fetch couple details
      const coupleInfo = await coupleService.getCoupleInfo();

      // 2. Fetch moments of the current hour slot
      await fetchCurrentMoments();

      // 3. Pre-fetch conversation for chat navigation
      if (coupleInfo.partner && currentUser) {
        const currentId =
          currentUser._id || currentUser.id || currentUser.userId;
        const partnerId =
          coupleInfo.partner._id ||
          coupleInfo.partner.id ||
          coupleInfo.partner.userId;

        try {
          await chatService.getOrCreateConversation(currentId, partnerId);
        } catch (err) {
          console.warn('Failed to pre-fetch conversation:', err);
        }
      }
    } catch (error) {
      console.error('Error fetching love moments data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [currentUser, fetchCurrentMoments]);

  useEffect(() => {
    if (isFocused) {
      setLoading(true);
      fetchAllData();
    }
  }, [isFocused, fetchAllData]);

  // Real-time: auto-refresh when partner sends a new moment
  useEffect(() => {
    if (!socket || !isFocused) return;
    const handler = (newMoment: any) => {
      console.log('[LoveMomentScreen] moment:new received, adding to list...');
      setMoments(prev => {
        // Avoid duplicate if the moment already exists (e.g., sent by self)
        if (prev.find(m => m._id === newMoment._id)) return prev;
        return [...prev, newMoment];
      });
      // Show toast and auto-dismiss after 5s
      setNotification('Đối phương vừa gửi một khoảnh khắc mới! 💕');
      setTimeout(() => {
        useAppStore.getState().setNotification(null);
      }, 5000);
    };
    socket.on('moment:new', handler);
    return () => {
      socket.off('moment:new', handler);
    };
  }, [socket, isFocused, setNotification]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchAllData();
  };

  // Get current hour text (e.g. 10:00)
  const getCurrentHourText = () => {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    return `${hours}:00`;
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0A0A0A" />

      {/* Decorative Ornaments */}
      <View style={styles.topOrnamentContainer} pointerEvents="none">
        <Image
          source={require('../assets/butterfly_light.webp')}
          style={styles.butterflyLeft}
          resizeMode="contain"
        />
        <Image
          source={require('../assets/butterfly_light.webp')}
          style={styles.butterflyRight}
          resizeMode="contain"
        />
      </View>

      {/* Ornate Plaque Header */}
      <View style={styles.header}>
        <LinearGradient
          colors={['#FFC0D3', '#FFA0B8', '#E04A76']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerBorder}
        >
          <View style={styles.headerInner}>
            <Text style={styles.headerTitle}>Love moments</Text>
          </View>
        </LinearGradient>
      </View>

      {/* Scrollable Photos Area */}
      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={COLOR_PALETTE.brightPink} />
        </View>
      ) : (
        <ScrollView
          style={styles.scrollArea}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={COLOR_PALETTE.brightPink}
            />
          }
        >
          {moments.length === 0 ? (
            /* Sleeping Fallback */
            <View style={styles.sleepingContainer}>
              <View style={styles.sleepingIconGlow}>
                <LinearGradient
                  colors={[
                    'rgba(255, 141, 161, 0.2)',
                    'rgba(255, 78, 114, 0.05)',
                  ]}
                  style={styles.sleepingGlowCircle}
                >
                  <Icon name="moon" size={80} color="#FF9DB2" />
                </LinearGradient>
              </View>
              <Text style={styles.sleepingTitle}>Đang ngủ...</Text>
              <Text style={styles.sleepingSub}>
                Chưa có ảnh nào được chia sẻ trong khung giờ hiện tại. Hãy gửi
                một khoảnh khắc của bạn nhé!
              </Text>
            </View>
          ) : (
            /* Moments Cards */
            <View style={styles.momentsList}>
              {moments.map(moment => (
                <View key={moment._id} style={styles.momentCardBorder}>
                  <LinearGradient
                    colors={['#FFB2C5', 'rgba(255, 78, 114, 0.2)', '#FFB2C5']}
                    style={styles.momentCardGradient}
                  >
                    <View style={styles.momentCardInner}>
                      <Image
                        source={{ uri: moment.imageUrl }}
                        style={styles.momentImage}
                        resizeMode="cover"
                      />

                      {/* Dark overlay for text readability */}
                      <LinearGradient
                        colors={['transparent', 'rgba(0, 0, 0, 0.8)']}
                        style={styles.imageOverlay}
                      />

                      {/* Overlaid Texts */}
                      <View style={styles.momentTexts}>
                        <Text style={styles.momentTime}>
                          {getCurrentHourText()}
                        </Text>
                        <Text style={styles.momentCaption} numberOfLines={1}>
                          {moment.caption || 'Chia sẻ một khoảnh khắc'}
                        </Text>
                      </View>
                    </View>
                  </LinearGradient>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      )}

      {/* Premium Bottom Tab Navigation Bar */}
      <View style={styles.bottomNav}>
        {/* Left: History Grid Button */}
        <TouchableOpacity
          style={styles.navButton}
          onPress={() => navigation.navigate('LoveHistory')}
          activeOpacity={0.7}
        >
          <Icon name="images-outline" size={28} color="#FFE0EA" />
        </TouchableOpacity>

        {/* Center: Rose Camera Button */}
        <TouchableOpacity
          style={styles.roseButtonContainer}
          onPress={() => navigation.navigate('MomentTaking')}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={['#FFEAF0', '#FFB2C5', '#FF4E72', '#B31A3D']}
            style={styles.roseOuterRing}
          >
            <LinearGradient
              colors={['#FFF6F8', '#FFB8CD', '#FF6B8B']}
              style={styles.roseInnerRing}
            >
              <Icon name="rose" size={32} color="#8A0F2B" />
            </LinearGradient>
          </LinearGradient>
        </TouchableOpacity>

        {/* Right: Back to Home Button */}
        <TouchableOpacity
          style={styles.navButton}
          onPress={() => navigation.navigate('Main')}
          activeOpacity={0.7}
        >
          <Icon name="home-outline" size={28} color="#FFE0EA" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default LoveMomentScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topOrnamentContainer: {
    position: 'absolute',
    top: 20,
    left: 0,
    right: 0,
    height: 60,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 40,
    zIndex: 2,
    opacity: 0.7,
  },
  butterflyLeft: {
    width: 32,
    height: 32,
    transform: [{ rotate: '-15deg' }],
  },
  butterflyRight: {
    width: 32,
    height: 32,
    transform: [{ rotate: '15deg' }, { scaleX: -1 }],
  },
  header: {
    marginTop: 64,
    alignSelf: 'center',
    width: SW * 0.72,
    height: 52,
    zIndex: 3,
    shadowColor: COLOR_PALETTE.pink,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  headerBorder: {
    padding: 1.5,
    borderRadius: 25,
  },
  headerInner: {
    backgroundColor: '#1C060D',
    borderRadius: 23,
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#FFD3DF',
    fontSize: 18,
    fontFamily: 'Serif',
    fontWeight: 'bold',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  scrollArea: {
    flex: 1,
    marginTop: 16,
    marginBottom: 100,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  sleepingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
    marginTop: SH * 0.1,
  },
  sleepingIconGlow: {
    width: 140,
    height: 140,
    borderRadius: 70,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FF4E72',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
  },
  sleepingGlowCircle: {
    width: 130,
    height: 130,
    borderRadius: 65,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 141, 161, 0.15)',
  },
  sleepingTitle: {
    color: '#FFE2E8',
    fontSize: 22,
    fontWeight: '800',
    marginTop: 24,
    letterSpacing: 0.5,
  },
  sleepingSub: {
    color: 'rgba(255, 226, 234, 0.55)',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 20,
  },
  momentsList: {
    gap: 20,
    marginTop: 10,
  },
  momentCardBorder: {
    borderRadius: 24,
    shadowColor: '#FF4E72',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 12,
    elevation: 8,
  },
  momentCardGradient: {
    padding: 1.5,
    borderRadius: 24,
  },
  momentCardInner: {
    borderRadius: 22,
    overflow: 'hidden',
    height: 240,
    backgroundColor: '#120206',
  },
  momentImage: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  momentTexts: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  momentTime: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '900',
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  momentCaption: {
    color: '#FFE4EB',
    fontSize: 15,
    fontWeight: '600',
    maxWidth: SW * 0.6,
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  bottomNav: {
    position: 'absolute',
    bottom: 24,
    left: 20,
    right: 20,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(18, 4, 9, 0.95)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 178, 197, 0.15)',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.6,
    shadowRadius: 15,
    elevation: 10,
    zIndex: 10,
  },
  navButton: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 25,
  },
  roseButtonContainer: {
    width: 86,
    height: 86,
    transform: [{ translateY: -20 }],
    shadowColor: '#FF4E72',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 12,
    elevation: 12,
  },
  roseOuterRing: {
    width: '100%',
    height: '100%',
    borderRadius: 43,
    padding: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  roseInnerRing: {
    width: '100%',
    height: '100%',
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
  },
});
