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
  keyboardType = 'default',
}: {
  icon: string;
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (t: string) => void;
  secureTextEntry?: boolean;
  rightElement?: React.ReactNode;
  keyboardType?: any;
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
          keyboardType={keyboardType}
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

const ForgotPasswordScreen = ({ navigation }: any) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [secureText, setSecureText] = useState(true);
  const [secureConfirm, setSecureConfirm] = useState(true);

  const fadeIn = useRef(new Animated.Value(0)).current;
  const slideUp = useRef(new Animated.Value(32)).current;

  useEffect(() => {
    fadeIn.setValue(0);
    slideUp.setValue(32);
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
  }, [fadeIn, slideUp, step]);

  const handleSendOtp = async () => {
    if (!email.trim()) {
      Alert.alert('Thông báo', 'Vui lòng nhập địa chỉ email');
      return;
    }
    setLoading(true);
    try {
      await authApi.sendOtp(email);
      setStep(2);
    } catch (err: any) {
      Alert.alert('Lỗi', err.message || 'Không thể gửi OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp.trim()) {
      Alert.alert('Thông báo', 'Vui lòng nhập mã OTP');
      return;
    }
    setLoading(true);
    try {
      await authApi.verifyOtp(email, otp);
      setStep(3);
    } catch (err: any) {
      Alert.alert('Lỗi', err.message || 'Mã OTP không đúng');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!password.trim() || !confirmPassword.trim()) {
      Alert.alert('Thông báo', 'Vui lòng nhập mật khẩu mới');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Thông báo', 'Mật khẩu xác nhận không khớp');
      return;
    }
    setLoading(true);
    try {
      await authApi.resetPassword(email, password);
      Alert.alert('Thành công', 'Mật khẩu của bạn đã được cập nhật', [
        { text: 'Đăng nhập ngay', onPress: () => navigation.navigate('Login') },
      ]);
    } catch (err: any) {
      Alert.alert('Lỗi', err.message || 'Không thể đặt lại mật khẩu');
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
            <Text style={styles.formTitle}>Quên mật khẩu</Text>
            <Text style={styles.formSubtitle}>
              {step === 1 && 'Nhập email để nhận mã xác thực OTP'}
              {step === 2 && 'Mã OTP đã được gửi đến email của bạn'}
              {step === 3 && 'Tạo mật khẩu mới cho tài khoản của bạn'}
            </Text>
          </View>

          <View style={styles.separator} />

          {step === 1 && (
            <>
              <PinkInput
                icon="mail-outline"
                label="ĐỊA CHỈ EMAIL"
                placeholder="you@example.com"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
              />

              <TouchableOpacity
                style={[styles.mainBtn, loading && { opacity: 0.6 }]}
                onPress={handleSendOtp}
                disabled={loading}
                activeOpacity={0.85}
              >
                {loading ? (
                  <ActivityIndicator color={COLOR_PALETTE.pink} />
                ) : (
                  <>
                    <Icon
                      name="paper-plane-outline"
                      size={17}
                      color={COLOR_PALETTE.pink}
                      style={{ marginRight: 10 }}
                    />
                    <Text style={styles.mainBtnText}>Nhận mã OTP</Text>
                  </>
                )}
              </TouchableOpacity>
            </>
          )}

          {step === 2 && (
            <>
              <Text
                style={{
                  color: 'rgba(255,194,209,0.7)',
                  fontSize: 13,
                  marginBottom: 20,
                }}
              >
                Đang gửi tới:{' '}
                <Text style={{ fontWeight: 'bold', color: COLOR_PALETTE.pink }}>
                  {email}
                </Text>
              </Text>
              <PinkInput
                icon="shield-checkmark-outline"
                label="MÃ XÁC THỰC OTP"
                placeholder="Nhập 6 số OTP"
                value={otp}
                onChangeText={setOtp}
                keyboardType="number-pad"
              />

              <TouchableOpacity
                style={[styles.mainBtn, loading && { opacity: 0.6 }]}
                onPress={handleVerifyOtp}
                disabled={loading}
                activeOpacity={0.85}
              >
                {loading ? (
                  <ActivityIndicator color={COLOR_PALETTE.pink} />
                ) : (
                  <>
                    <Icon
                      name="checkmark-circle-outline"
                      size={17}
                      color={COLOR_PALETTE.pink}
                      style={{ marginRight: 10 }}
                    />
                    <Text style={styles.mainBtnText}>Xác nhận OTP</Text>
                  </>
                )}
              </TouchableOpacity>

              <View style={{ alignItems: 'center', marginTop: 16 }}>
                <TouchableOpacity
                  style={styles.footerLink}
                  onPress={() => setStep(1)}
                  disabled={loading}
                >
                  <Text style={styles.footerLinkText}>Sai email? </Text>
                  <Text style={styles.footerLinkHighlight}>Nhập lại</Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          {step === 3 && (
            <>
              <PinkInput
                icon="lock-closed-outline"
                label="MẬT KHẨU MỚI"
                placeholder="Nhập mật khẩu mới"
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

              <PinkInput
                icon="lock-closed-outline"
                label="XÁC NHẬN MẬT KHẨU"
                placeholder="Nhập lại mật khẩu mới"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={secureConfirm}
                rightElement={
                  <TouchableOpacity
                    onPress={() => setSecureConfirm(!secureConfirm)}
                    style={styles.eyeBtn}
                  >
                    <Icon
                      name={secureConfirm ? 'eye-off-outline' : 'eye-outline'}
                      size={19}
                      color="rgba(255,194,209,0.45)"
                    />
                  </TouchableOpacity>
                }
              />

              <TouchableOpacity
                style={[styles.mainBtn, loading && { opacity: 0.6 }]}
                onPress={handleResetPassword}
                disabled={loading}
                activeOpacity={0.85}
              >
                {loading ? (
                  <ActivityIndicator color={COLOR_PALETTE.pink} />
                ) : (
                  <>
                    <Icon
                      name="save-outline"
                      size={17}
                      color={COLOR_PALETTE.pink}
                      style={{ marginRight: 10 }}
                    />
                    <Text style={styles.mainBtnText}>Đổi mật khẩu</Text>
                  </>
                )}
              </TouchableOpacity>
            </>
          )}

          <View style={styles.footerRow}>
            <View style={styles.footerDivider} />
            <TouchableOpacity
              style={styles.footerLink}
              onPress={() => navigation.navigate('Login')}
            >
              <Text style={styles.footerLinkText}>Quay lại </Text>
              <Text style={styles.footerLinkHighlight}>Đăng nhập</Text>
            </TouchableOpacity>
            <View style={styles.footerDivider} />
          </View>
        </Animated.View>
      </ScrollView>
      <LoadingOverlay visible={loading} message="Processing Request..." />
    </KeyboardAvoidingView>
  );
};

export default ForgotPasswordScreen;

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
    ...({ boxShadow: 'inset 0px -1px 3px 0px #ffc2d1' } as ViewStyle),
  },
  heartGlowIcon: {
    textShadowColor: COLOR_PALETTE.pink,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  brandBlock: {
    position: 'absolute',
    left: HX + HEART_D / 2 + 40,
    top: HY - 28,
  },
  brandTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: COLOR_PALETTE.pink,
    letterSpacing: 5,
    marginBottom: 6,
    textShadowColor: COLOR_PALETTE.roseRed,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  brandSub: {
    fontSize: 14,
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
    ...({ boxShadow: '0px 0px 4px 0px rgba(255,194,209,0.15)' } as ViewStyle),
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
    ...({ boxShadow: 'inset 0px -2px 16px 0px #ffc2d1' } as ViewStyle),
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
