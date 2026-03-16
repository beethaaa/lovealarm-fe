/* eslint-disable react-native/no-inline-styles */
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Animated,
  StatusBar,
  ScrollView,
  Dimensions,
  ViewStyle,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import COLOR_PALETTE from '../styles/colorPalette';
import { authApi } from '../services/authService';
import { useAppStore } from '../store/appStore';
import LoadingOverlay from '@/components/LoadingOverlay';

const { width: SW } = Dimensions.get('window');

const HX = 90;
const HY = 110;
const HEART_D = 96;

const RadarRing = ({ delay, size }: { delay: number; size: number }) => {
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
      style={{
        position: 'absolute',
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth: 1.5,
        borderColor: COLOR_PALETTE.cherryBlossomPink,
        left: HX - size / 2,
        top: HY - size / 2,
        opacity,
        transform: [{ scale }],
      }}
    />
  );
};

const RadarSection = () => {
  const beat = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(beat, {
          toValue: 1.18,
          duration: 160,
          useNativeDriver: true,
        }),
        Animated.timing(beat, {
          toValue: 0.95,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(beat, {
          toValue: 1.08,
          duration: 120,
          useNativeDriver: true,
        }),
        Animated.timing(beat, {
          toValue: 1.0,
          duration: 280,
          useNativeDriver: true,
        }),
        Animated.delay(950),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, [beat]);

  return (
    <View style={styles.radarSection}>
      <RadarRing delay={0} size={SW * 0.75} />
      <RadarRing delay={800} size={SW * 0.75} />
      <RadarRing delay={1600} size={SW * 0.75} />

      <View
        style={[
          styles.heartCircle,
          {
            position: 'absolute',
            left: HX - HEART_D / 2,
            top: HY - HEART_D / 2,
          },
        ]}
      >
        <Animated.View style={{ transform: [{ scale: beat }] }}>
          <Icon
            name="heart"
            size={48}
            color={COLOR_PALETTE.cherryBlossomPink}
            style={styles.heartGlowIcon}
          />
        </Animated.View>
      </View>

      <View style={styles.brandBlock}>
        <Text style={styles.brandTitle}>LOVE ALARM</Text>
        <Text style={styles.brandSub}>Where is your true love?</Text>
      </View>
    </View>
  );
};

const PinkInput = ({
  icon,
  label,
  placeholder,
  value,
  onChangeText,
  secureTextEntry = false,
  rightElement,
}: {
  icon: string;
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (t: string) => void;
  secureTextEntry?: boolean;
  rightElement?: React.ReactNode;
}) => {
  const [focused, setFocused] = useState(false);
  const anim = useRef(new Animated.Value(0)).current;

  const run = (v: number) =>
    Animated.timing(anim, {
      toValue: v,
      duration: 200,
      useNativeDriver: false,
    }).start();

  const borderColor = anim.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(255,194,209,0.15)', COLOR_PALETTE.pink],
  });
  const labelColor = anim.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(255,194,209,0.4)', COLOR_PALETTE.pink],
  });

  return (
    <View style={styles.fieldGroup}>
      <Animated.View style={styles.fieldLabelRow}>
        <Icon
          name={icon}
          size={13}
          color={focused ? COLOR_PALETTE.pink : 'rgba(255,194,209,0.5)'}
        />
        <Animated.Text style={[styles.fieldLabel, { color: labelColor }]}>
          {label}
        </Animated.Text>
      </Animated.View>

      <Animated.View
        style={[
          styles.fieldInputRow,
          { borderColor },
          focused &&
            ({
              boxShadow: 'inset 0px -1px 8px 0px rgba(255,194,209,0.08)',
            } as ViewStyle),
        ]}
      >
        <TextInput
          placeholder={placeholder}
          placeholderTextColor="rgba(255,194,209,0.2)"
          style={styles.fieldInput}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry}
          autoCapitalize="none"
          onFocus={() => {
            setFocused(true);
            run(1);
          }}
          onBlur={() => {
            setFocused(false);
            run(0);
          }}
        />
        {rightElement}
      </Animated.View>
    </View>
  );
};

const LoginScreen = ({ navigation }: any) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [secureText, setSecureText] = useState(true);
  const setLogin = useAppStore(state => state.setLogin);
  const setActiveTab = useAppStore(state => state.setActiveTab);

  const fadeIn = useRef(new Animated.Value(0)).current;
  const slideUp = useRef(new Animated.Value(32)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeIn, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(slideUp, {
        toValue: 0,
        tension: 55,
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

      let user = res?.data?.user || res?.user || (res?.data && res?.data?._id ? res.data : null) || res;
      console.log('[LoginScreen] Login success, user extraction attempt:', JSON.stringify(user));

      const apiIsFirstLogin = res?.isFirstLogin ?? res?.data?.isFirstLogin;
      const isNewUser = apiIsFirstLogin !== undefined 
        ? apiIsFirstLogin 
        : (user ? !user?.profile?.name : true);

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
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.root}
    >
      <StatusBar barStyle="light-content" backgroundColor="#0A0A0A" />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <RadarSection />

        <Animated.View
          style={[
            styles.formSection,
            { opacity: fadeIn, transform: [{ translateY: slideUp }] },
          ]}
        >
          <View style={styles.formHeader}>
            <Text style={styles.formTitle}>Đăng nhập</Text>
            <Text style={styles.formSubtitle}>
              Chào mừng trở lại với Love Alarm{' '}
            </Text>
          </View>

          <View style={styles.separator} />

          <PinkInput
            icon="mail-outline"
            label="ĐỊA CHỈ EMAIL"
            placeholder="you@example.com"
            value={email}
            onChangeText={setEmail}
          />

          <PinkInput
            icon="lock-closed-outline"
            label="MẬT KHẨU"
            placeholder="Nhập mật khẩu của bạn"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={secureText}
            rightElement={
              <TouchableOpacity
                onPress={() => setSecureText(!secureText)}
                style={styles.eyeBtn}
              >
                <Icon
                  name={secureText ? 'eye-off-outline' : 'eye-outline'}
                  size={19}
                  color="rgba(255,194,209,0.45)"
                />
              </TouchableOpacity>
            }
          />

          <TouchableOpacity
            style={styles.forgotRow}
            onPress={() => navigation.navigate('ForgotPassword')}
          >
            <Text style={styles.forgotText}>Quên mật khẩu?</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.mainBtn, loading && { opacity: 0.6 }]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color={COLOR_PALETTE.pink} />
            ) : (
              <>
                <Icon
                  name="heart"
                  size={17}
                  color={COLOR_PALETTE.pink}
                  style={{ marginRight: 10 }}
                />
                <Text style={styles.mainBtnText}>Đăng nhập</Text>
              </>
            )}
          </TouchableOpacity>

          <View style={styles.footerRow}>
            <View style={styles.footerDivider} />
            <TouchableOpacity
              style={styles.footerLink}
              onPress={() => navigation.navigate('Register')}
            >
              <Text style={styles.footerLinkText}>Chưa có tài khoản? </Text>
              <Text style={styles.footerLinkHighlight}>Đăng ký ngay</Text>
            </TouchableOpacity>
            <View style={styles.footerDivider} />
          </View>
        </Animated.View>
      </ScrollView>
      <LoadingOverlay visible={loading} message="Heartbeat Syncing..." />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0A0A0A' },
  scroll: { flexGrow: 1, paddingBottom: 52 },

  radarSection: { height: 240 },
  heartCircle: {
    width: HEART_D,
    height: HEART_D,
    borderRadius: HEART_D / 2,
    backgroundColor: '#17050A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heartGlowIcon: {
    textShadowColor: COLOR_PALETTE.pink,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  brandBlock: {
    position: 'absolute',
    left: HX + HEART_D / 2 + 20,
    top: HY - 28,
  },
  brandTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: COLOR_PALETTE.pink,
    letterSpacing: 5,
    marginBottom: 6,
    textShadowColor: COLOR_PALETTE.roseRed,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  brandSub: {
    fontSize: 12,
    color: COLOR_PALETTE.amaranthPink,
    fontWeight: '400',
    opacity: 0.5,
  },

  formSection: {
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  formHeader: {
    marginBottom: 20,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: COLOR_PALETTE.pink,
    letterSpacing: 0.3,
    textShadowColor: COLOR_PALETTE.brightPink,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  formSubtitle: {
    fontSize: 12,
    color: 'rgba(255,194,209,0.4)',
    fontWeight: '500',
    marginTop: 6,
    letterSpacing: 0.5,
  },

  separator: {
    height: 1,
    backgroundColor: 'rgba(255,194,209,0.08)',
    marginBottom: 24,
  },

  fieldGroup: { marginBottom: 20 },
  fieldLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  fieldLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  fieldInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1.5,
    paddingBottom: 12,
  },
  fieldInput: {
    flex: 1,
    color: COLOR_PALETTE.lavenderBlush,
    fontSize: 16,
    fontWeight: '500',
    padding: 0,
  },
  eyeBtn: { paddingLeft: 8 },

  forgotRow: {
    alignSelf: 'flex-end',
    marginTop: -8,
    marginBottom: 12,
    paddingVertical: 4,
  },
  forgotText: {
    fontSize: 12,
    color: 'rgba(255,194,209,0.4)',
    fontWeight: '600',
    letterSpacing: 0.3,
  },

  mainBtn: {
    height: 56,
    borderRadius: 28,
    backgroundColor: '#17050A',
    borderWidth: 1.5,
    borderColor: 'rgba(255,194,209,0.3)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 4,
  },
  mainBtnText: {
    color: COLOR_PALETTE.pink,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
  },

  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 32,
    gap: 12,
  },
  footerDivider: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255,194,209,0.08)',
  },
  footerLink: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerLinkText: {
    color: 'rgba(255,194,209,0.35)',
    fontSize: 13,
  },
  footerLinkHighlight: {
    color: COLOR_PALETTE.pink,
    fontSize: 13,
    fontWeight: '800',
    textShadowColor: COLOR_PALETTE.brightPink,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 6,
  },
});

export default LoginScreen;
