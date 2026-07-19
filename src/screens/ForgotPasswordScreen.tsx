// @refresh reset
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Platform,
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
import AppAlert, { AppAlertConfig } from '@/components/AppAlert';
import LoadingOverlay from '@/components/LoadingOverlay';
import { authApi } from '../services/authService';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const SCENE_HEIGHT = Math.max(SCREEN_HEIGHT, 820);
const PANEL_WIDTH = Math.min(SCREEN_WIDTH - 56, 500);

const assets = {
  title: require('../assets/title.webp'),
  rose_light: require('../assets/rose_light.webp'),
  cloud: require('../assets/cloud.webp'),
  butterfly: require('../assets/butterfly_light.webp'),
  openButton: require('../assets/button.webp'),
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
  const [alertConfig, setAlertConfig] = useState<AppAlertConfig | null>(null);

  const fadeIn = useRef(new Animated.Value(0)).current;
  const slideUp = useRef(new Animated.Value(32)).current;
  let otpInputRef: TextInput | null = null;

  const showAlert = (config: AppAlertConfig) => {
    setAlertConfig(config);
  };

  const closeAlert = () => {
    const nextAction = alertConfig?.onConfirm;
    setAlertConfig(null);
    nextAction?.();
  };

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
      showAlert({
        title: 'Thông báo',
        message: 'Vui lòng nhập địa chỉ email',
        variant: 'info',
      });
      return;
    }
    setLoading(true);
    try {
      await authApi.sendOtp(email);
      setStep(2);
    } catch (err: any) {
      showAlert({
        title: 'Lỗi',
        message: err.message || 'Không thể gửi OTP',
        variant: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp.trim()) {
      showAlert({
        title: 'Thông báo',
        message: 'Vui lòng nhập mã OTP',
        variant: 'info',
      });
      return;
    }
    setLoading(true);
    try {
      console.log(email, otp)
      await authApi.verifyOtp(email, otp);
      setStep(3);
    } catch (err: any) {
      console.log(otp)
      showAlert({
        title: 'Lỗi',
        message: err.message || 'Mã OTP không đúng',
        variant: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!password.trim() || !confirmPassword.trim()) {
      showAlert({
        title: 'Thông báo',
        message: 'Vui lòng nhập mật khẩu mới',
        variant: 'info',
      });
      return;
    }
    if (password.length < 8) {
      showAlert({
        title: 'Mật khẩu chưa đủ mạnh',
        message: 'Mật khẩu phải có ít nhất 8 ký tự.',
        variant: 'error',
      });
      return;
    }
    if (password !== confirmPassword) {
      showAlert({
        title: 'Thông báo',
        message: 'Mật khẩu xác nhận không khớp',
        variant: 'info',
      });
      return;
    }
    setLoading(true);
    try {
      await authApi.resetPassword(email, password);
      showAlert({
        title: 'Thành công',
        message: 'Mật khẩu của bạn đã được cập nhật',
        variant: 'success',
        confirmText: 'Đăng nhập ngay',
        onConfirm: () => navigation.navigate('Login'),
      });
    } catch (err: any) {
      showAlert({
        title: 'Lỗi',
        message: err.message || 'Không thể đặt lại mật khẩu',
        variant: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const goBackStep = () => {
    if (step === 2) {
      setStep(1);
      return;
    }
    if (step === 3) {
      setStep(2);
    }
  };

  const handleOtpChange = (value: string) => {
    setOtp(value.replace(/\D/g, '').slice(0, 6));
  };

  const actionText =
    step === 1 ? 'Send OTP' : step === 2 ? 'Verify OTP' : 'Reset Password';
  const actionPress =
    step === 1
      ? handleSendOtp
      : step === 2
      ? handleVerifyOtp
      : handleResetPassword;
  const progressWidth = step === 1 ? '33%' : step === 2 ? '66%' : '100%';
  const panelStepStyle = [styles.panel, step === 3 && styles.panelPassword];

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.root}
    >
      <StatusBar barStyle="light-content" backgroundColor="#020001" />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        bounces={false}
      >
        <LinearGradient
          colors={['#000000', '#030002', '#110511', '#1f071d']}
          locations={[0, 0.45, 0.78, 1]}
          style={StyleSheet.absoluteFillObject}
        />

        <Image
          source={assets.cloud}
          style={styles.cloud}
          resizeMode="contain"
        />
        <Image source={assets.rose_light} style={styles.roseLight} resizeMode="contain" />
        <Image
          source={assets.butterfly}
          style={styles.butterfly}
          resizeMode="contain"
        />

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
            source={assets.butterfly}
            style={styles.butterflyTop}
            resizeMode="contain"
          />

          <View style={panelStepStyle}>
            <View style={styles.form}>
              <View style={styles.headerRow}>
                {step > 1 ? (
                  <TouchableOpacity
                    onPress={goBackStep}
                    style={styles.backBtn}
                    activeOpacity={0.75}
                    disabled={loading}
                  >
                    <Icon
                      name="arrow-back"
                      size={19}
                      color="rgba(255,221,233,0.78)"
                    />
                  </TouchableOpacity>
                ) : (
                  <View style={styles.backBtnPlaceholder} />
                )}
                <View style={styles.headerTextWrap}>
                  <Text style={styles.formTitle}>Forgot Password</Text>
                  <Text style={styles.formSubtitle}>
                    {step === 1 && 'Step 1 / 3 - Email'}
                    {step === 2 && 'Step 2 / 3 - OTP'}
                    {step === 3 && 'Step 3 / 3 - New Password'}
                  </Text>
                </View>
                <View style={styles.backBtnPlaceholder} />
              </View>

              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: progressWidth }]} />
              </View>

              <View
                style={[
                  styles.stepWindow,
                  step === 3 && styles.stepWindowPassword,
                ]}
              >
                {step === 1 && (
                  <TextInput
                    placeholder="Email"
                    placeholderTextColor="rgba(255,221,233,0.45)"
                    style={styles.input}
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                  />
                )}

                {step === 2 && (
                  <View>
                    <TouchableOpacity
                      onPress={() => setStep(1)}
                      style={styles.emailTag}
                      activeOpacity={0.75}
                      disabled={loading}
                    >
                      <Icon
                        name="mail-outline"
                        size={16}
                        color="rgba(255,221,233,0.72)"
                      />
                      <Text style={styles.emailTagText} numberOfLines={1}>
                        {email}
                      </Text>
                      <Icon
                        name="pencil-outline"
                        size={14}
                        color="rgba(255,221,233,0.5)"
                      />
                    </TouchableOpacity>
                    <TouchableOpacity
                      activeOpacity={1}
                      style={styles.otpRow}
                      onPress={() => otpInputRef?.focus()}
                    >
                      {Array.from({ length: 6 }).map((_, index) => (
                        <View
                          key={index}
                          style={[
                            styles.otpBox,
                            index === otp.length && styles.otpBoxActive,
                          ]}
                        >
                          <Text style={styles.otpBoxText}>{otp[index] || ''}</Text>
                        </View>
                      ))}
                      <TextInput
                        ref={ref => {
                          otpInputRef = ref;
                        }}
                        value={otp}
                        onChangeText={handleOtpChange}
                        keyboardType="number-pad"
                        textContentType="oneTimeCode"
                        maxLength={6}
                        caretHidden
                        selectTextOnFocus={false}
                        style={styles.otpHiddenInput}
                      />
                    </TouchableOpacity>
                  </View>
                )}

                {step === 3 && (
                  <View>
                    <View style={styles.passwordRow}>
                      <TextInput
                        placeholder="New password"
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

                    <View style={styles.passwordRow}>
                      <TextInput
                        placeholder="Confirm password"
                        placeholderTextColor="rgba(255,221,233,0.45)"
                        style={[styles.input, styles.passwordInput]}
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        secureTextEntry={secureConfirm}
                        autoCapitalize="none"
                      />
                      <TouchableOpacity
                        onPress={() => setSecureConfirm(!secureConfirm)}
                        style={styles.eyeBtn}
                        activeOpacity={0.75}
                      >
                        <Icon
                          name={secureConfirm ? 'eye-off-outline' : 'eye-outline'}
                          size={20}
                          color="rgba(255,221,233,0.72)"
                        />
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </View>

              <TouchableOpacity
                style={[styles.openButtonFrame, loading && styles.disabledButton]}
                onPress={actionPress}
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
                {loading ? (
                  <ActivityIndicator
                    color="#ffe8f1"
                    style={styles.openButtonContent}
                  />
                ) : (
                  <Text style={[styles.openButtonText, styles.openButtonContent]}>
                    {actionText}
                  </Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => navigation.navigate('Login')}
                activeOpacity={0.75}
                style={styles.loginLinkBelow}
                disabled={loading}
              >
                <Text style={styles.linkText}>Back to Login</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      </ScrollView>

      <LoadingOverlay visible={loading} message="Processing Request..." />
      <AppAlert
        visible={!!alertConfig}
        title={alertConfig?.title || ''}
        message={alertConfig?.message || ''}
        variant={alertConfig?.variant}
        confirmText={alertConfig?.confirmText}
        onClose={closeAlert}
      />
    </KeyboardAvoidingView>
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
  butterflyTop: {
    position: 'absolute',
    top: Math.max(150, SCENE_HEIGHT * 0.15),
    right: Math.max(20, SCREEN_WIDTH * 0.1),
    width: Math.min(SCREEN_WIDTH * 0.2, 118),
    height: Math.min(SCREEN_WIDTH * 0.32, 178),
    zIndex: 7,
    transform: [{ scale: 1 }],
    filter: 'drop-shadow(0px 0px 20px rgba(255, 155, 215, 1))',
  },
  panel: {
    width: PANEL_WIDTH,
    height: Math.min(Math.max(SCENE_HEIGHT * 0.3, 400), 460),
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
  panelPassword: {
    height: Math.min(Math.max(SCENE_HEIGHT * 0.48, 460), 530),
  },
  form: {
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: 36,
    paddingBottom: 24,
    justifyContent: 'flex-start',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  headerTextWrap: {
    flex: 1,
    alignItems: 'center',
  },
  backBtn: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtnPlaceholder: {
    width: 34,
    height: 34,
  },
  formTitle: {
    fontSize: 24,
    fontFamily: 'serif',
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#e8c5ce',
    textShadowColor: '#c12a7f',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 9,
  },
  formSubtitle: {
    marginTop: 4,
    color: 'rgba(255,221,233,0.55)',
    fontSize: 12,
    fontFamily: 'serif',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  progressTrack: {
    height: 2,
    backgroundColor: 'rgba(255,213,229,0.16)',
    borderRadius: 2,
    marginBottom: 12,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
    backgroundColor: 'rgba(255,184,211,0.86)',
  },
  stepWindow: {
    minHeight: 108,
    overflow: 'hidden',
    justifyContent: 'flex-start',
    paddingTop: 14,
  },
  stepWindowPassword: {
    minHeight: 180,
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
  emailTag: {
    height: 40,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderBottomWidth: 1,
    borderColor: 'rgba(255,213,229,0.25)',
    marginBottom: 16,
  },
  emailTagText: {
    flex: 1,
    color: 'rgba(255,221,233,0.72)',
    fontSize: 13,
    fontFamily: 'serif',
    fontWeight: 'bold',
  },
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  otpBox: {
    width: Math.min((PANEL_WIDTH - 96) / 6, 44),
    height: 48,
    borderWidth: 1,
    borderColor: 'rgba(255,213,229,0.38)',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,221,233,0.035)',
  },
  otpBoxActive: {
    borderColor: 'rgba(255,184,211,0.86)',
    shadowColor: '#f9a2cb',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
  },
  otpBoxText: {
    color: '#ffe8f1',
    fontSize: 18,
    fontFamily: 'serif',
    fontWeight: 'bold',
    textAlign: 'center',
    textShadowColor: 'rgba(255,157,205,0.35)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  otpHiddenInput: {
    position: 'absolute',
    width: 1,
    height: 1,
    opacity: 0.01,
  },
  loginLinkBelow: {
    marginTop: 4,
    zIndex: 10,
    elevation: 10,
    minHeight: 26,
    alignItems: 'center',
    justifyContent: 'center',
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
    marginTop: 28,
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
  },
  openButtonText: {
    color: '#934564',
    fontSize: 18,
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
  cloud: {
    position: 'absolute',
    left: -60,
    bottom: -40,
    width: Math.min(SCREEN_WIDTH * 0.82, 520),
    height: 260,
    opacity: 0.5,
    zIndex: 1,
    transform: [{ scale: 2 }, { rotate: '-6deg' }],
  },
  roseLight: {
    position: 'absolute',
    left: 0,
    bottom: 72,
    width: Math.min(SCREEN_WIDTH * 0.62, 390),
    height: Math.min(SCREEN_WIDTH * 0.34, 220),
    zIndex: 2,
    transform: [{ scale: 1.7 }],
  },
  butterfly: {
    position: 'absolute',
    right: Math.max(24, SCREEN_WIDTH * 0.1),
    bottom: Math.max(158, SCENE_HEIGHT * 0.18),
    width: Math.min(SCREEN_WIDTH * 0.12, 70),
    height: Math.min(SCREEN_WIDTH * 0.12, 70),
    zIndex: 3,
    transform: [{ scaleX: -1.2 }, { scaleY: 1.2 }],
    filter: 'drop-shadow(0px 0px 20px rgba(255, 155, 215, 1))',
  },
});

export default ForgotPasswordScreen;
