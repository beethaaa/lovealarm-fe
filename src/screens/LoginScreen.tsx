// @refresh reset
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Dimensions,
  Image,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import LoadingOverlay from '@/components/LoadingOverlay';
import { authApi } from '../services/authService';
import { useAppStore } from '../store/appStore';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const SCENE_HEIGHT = Math.max(SCREEN_HEIGHT, 820);
const PANEL_WIDTH = Math.min(SCREEN_WIDTH - 56, 500);
const PANEL_HEIGHT = Math.min(Math.max(SCENE_HEIGHT * 0.2, 350), 440);

const assets = {
  title: require('../assets/title.webp'),
  light: require('../assets/light.webp'),
  cloud: require('../assets/cloud.webp'),
  table: require('../assets/table.webp'),
  butterfly: require('../assets/butterfly_light.webp'),
  openButton: require('../assets/open_button.webp'),
};

const LoginScreen = ({ navigation }: any) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [secureText, setSecureText] = useState(true);

  const setLogin = useAppStore(state => state.setLogin);
  const setActiveTab = useAppStore(state => state.setActiveTab);

  const fadeIn = useRef(new Animated.Value(0)).current;
  const slideUp = useRef(new Animated.Value(28)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeIn, {
        toValue: 1,
        duration: 700,
        useNativeDriver: true,
      }),
      Animated.spring(slideUp, {
        toValue: 0,
        tension: 42,
        friction: 9,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeIn, slideUp]);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Thông báo', 'Vui lòng điền đầy đủ thông tin');
      return;
    }
    setLoading(true);
    try {
      const res = await authApi.login(email, password);
      const token =
        (typeof res === 'string' ? res : null) ||
        res?.access_token ||
        res?.accessToken ||
        res?.token ||
        res?.data?.token;

      const user =
        res?.data?.user ||
        res?.user ||
        (res?.data && res?.data?._id ? res.data : null) ||
        res;
      console.log(
        '[LoginScreen] Login success, user extraction attempt:',
        JSON.stringify(user),
      );

      const apiIsFirstLogin = res?.isFirstLogin ?? res?.data?.isFirstLogin;
      const isNewUser =
        apiIsFirstLogin !== undefined
          ? apiIsFirstLogin
          : user
          ? !user?.profile?.name
          : true;

      if (token) {
        await setLogin(token, isNewUser, user);
        setActiveTab('home');
      } else {
        Alert.alert('Lỗi dữ liệu', 'Đăng nhập OK nhưng không tìm thấy token.');
      }
    } catch (err: any) {
      Alert.alert('Đăng nhập thất bại', err.message || 'Lỗi kết nối máy chủ');
    } finally {
      setLoading(false);
    }
  };
  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#020001" />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        scrollEnabled={false}
        bounces={false}
      >
        <LinearGradient
          colors={['#000000', '#030002', '#110511', '#1f071d']}
          locations={[0, 0.45, 0.78, 1]}
          style={StyleSheet.absoluteFillObject}
        />

        <View pointerEvents="none" style={StyleSheet.absoluteFillObject}>
          <Image
            source={assets.cloud}
            style={styles.cloud}
            resizeMode="contain"
          />
          <Image
            source={assets.table}
            style={styles.table}
            resizeMode="contain"
          />
          <Image
            source={assets.butterfly}
            style={styles.butterfly}
            resizeMode="contain"
          />
        </View>

        <Animated.View
          style={[
            styles.scene,
            { opacity: fadeIn, transform: [{ translateY: slideUp }] },
          ]}
        >
          <Image
            source={assets.title}
            style={styles.title}
            resizeMode="contain"
          />

          <Image
            source={assets.light}
            style={styles.lantern}
            resizeMode="contain"
          />

          <View style={styles.panel}>
            <View style={styles.form}>
              <Text style={styles.formTitle}>Welcome Back!</Text>
              <TextInput
                placeholder="Email"
                placeholderTextColor="rgba(255,221,233,0.45)"
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />

              <View style={styles.passwordRow}>
                <TextInput
                  placeholder="Password"
                  placeholderTextColor="rgba(255,221,233,0.45)"
                  style={[styles.input, styles.passwordInput]}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={secureText}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  onPress={() => setSecureText(!secureText)}
                  style={styles.eyeBtn}
                  activeOpacity={0.75}
                >
                  <Icon
                    name={secureText ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color="rgba(255,221,233,0.72)"
                  />
                </TouchableOpacity>
              </View>

              <View style={styles.linkRow}>
                <TouchableOpacity
                  onPress={() => navigation.navigate('Register')}
                  activeOpacity={0.75}
                >
                  <Text style={styles.linkText}>Register</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => navigation.navigate('ForgotPassword')}
                  activeOpacity={0.75}
                >
                  <Text style={styles.linkText}>Forgot password?</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.openButtonFrame, loading && styles.disabledButton]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.88}
          >
            <View pointerEvents="none" style={styles.openButtonImageLayer}>
              <Image
                source={assets.openButton}
                style={styles.openButtonAsset}
                resizeMode="contain"
              />
            </View>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>

      <LoadingOverlay visible={loading} message="Heartbeat Syncing..." />
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#020001',
    overflow: 'hidden',
  },
  scroll: {
    minHeight: SCENE_HEIGHT,
    overflow: 'hidden',
  },
  scene: {
    minHeight: SCENE_HEIGHT,
    alignItems: 'center',
    paddingTop: Math.max(48, SCENE_HEIGHT * 0.06),
    paddingBottom: 240,
  },
  title: {
    width: Math.min(SCREEN_WIDTH * 0.58, 330),
    height: Math.min(SCREEN_WIDTH * 0.4, 145),
    zIndex: 5,
    transform: [{ scale: 1.7 }],
  },
  formTitle: {
    marginBottom: Math.max(22, SCENE_HEIGHT * 0.01),
    fontSize: 24,
    fontFamily: 'serif',
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#e8c5ce',
    textShadowColor: '#c12a7f',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 9,
  },
  lantern: {
    position: 'absolute',
    top: Math.max(142, SCENE_HEIGHT * 0.15),
    right: Math.max(20, SCREEN_WIDTH * 0.12),
    width: Math.min(SCREEN_WIDTH * 0.2, 118),
    height: Math.min(SCREEN_WIDTH * 0.32, 178),
    zIndex: 7,
    transform: [{ scale: 2 }],
    filter: 'drop-shadow(0px 0px 20px rgba(255, 155, 215, 1))',
  },
  panel: {
    width: PANEL_WIDTH,
    height: PANEL_HEIGHT,
    marginTop: Math.max(22, SCENE_HEIGHT * 0.035),
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(255,212,228,0.38)',
    backgroundColor: 'rgba(2,0,2,0.82)',
    shadowColor: '#f9a2cb',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.28,
    shadowRadius: 14,
    elevation: 10,
    justifyContent: 'center',
    zIndex: 4,
  },
  form: {
    paddingHorizontal: 28,
    paddingBottom: 28,
  },
  input: {
    height: 50,
    borderBottomWidth: 1,
    borderColor: 'rgba(255,213,229,0.32)',
    color: '#ffe8f1',
    fontSize: 16,
    fontWeight: '500',
    paddingHorizontal: 2,
    paddingVertical: 0,
    textShadowColor: 'rgba(255,157,205,0.35)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
    fontFamily: 'serif',
  },
  passwordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
  },
  passwordInput: {
    flex: 1,
  },
  eyeBtn: {
    width: 42,
    height: 50,
    alignItems: 'flex-end',
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderColor: 'rgba(255,213,229,0.32)',
  },
  linkRow: {
    marginTop: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 10,
    elevation: 10,
  },
  linkText: {
    color: 'rgba(255,221,233,0.66)',
    fontSize: 14,
    fontFamily: 'serif',
    fontWeight: 'bold',
  },
  openButtonFrame: {
    width: Math.min(SCREEN_WIDTH * 0.58, 342),
    height: Math.min(SCREEN_WIDTH * 0.16, 96),
    marginTop: -14,
    zIndex: 8,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
  },
  openButtonImageLayer: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledButton: {
    opacity: 0.75,
  },
  openButtonImage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  openButtonAsset: {
    width: '100%',
    height: '100%',
    transform: [{ scale: 3 }, { translateY: -6 }],
  },
  cloud: {
    position: 'absolute',
    right: -10,
    bottom: -10,
    width: Math.min(SCREEN_WIDTH * 0.82, 520),
    height: 220,
    opacity: 0.6,
    zIndex: 1,
    transform: [{ scale: 2 }],
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
  butterfly: {
    position: 'absolute',
    right: Math.max(24, SCREEN_WIDTH * 0.1),
    bottom: Math.max(158, SCENE_HEIGHT * 0.18),
    width: Math.min(SCREEN_WIDTH * 0.12, 70),
    height: Math.min(SCREEN_WIDTH * 0.12, 70),
    zIndex: 3,
    transform: [{ scaleX: -1 }],
    filter: 'drop-shadow(0px 0px 20px rgba(255, 155, 215, 1))',
  },
});

export default LoginScreen;
