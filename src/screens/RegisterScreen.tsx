// @refresh reset
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
import LoadingOverlay from '@/components/LoadingOverlay';
import { authApi } from '../services/authService';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const SCENE_HEIGHT = Math.max(SCREEN_HEIGHT, 820);
const PANEL_WIDTH = Math.min(SCREEN_WIDTH - 56, 500);

const assets = {
  title: require('../assets/title.webp'),
  book: require('../assets/book.webp'),
  cloud: require('../assets/cloud.webp'),
  butterfly: require('../assets/butterfly_light.webp'),
  openButton: require('../assets/button.webp'),
};

const RegisterScreen = ({ navigation }: any) => {
  const [step, setStep] = useState(0);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [secureText, setSecureText] = useState(true);
  const [secureConfirm, setSecureConfirm] = useState(true);

  const fadeIn = useRef(new Animated.Value(0)).current;
  const slideUp = useRef(new Animated.Value(32)).current;
  const step1Anim = useRef(new Animated.Value(0)).current;

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

  const goToStep1 = () => {
    if (!email.trim() || !email.includes('@')) {
      Alert.alert('Thông báo', 'Vui lòng nhập email hợp lệ');
      return;
    }
    Animated.sequence([
      Animated.timing(step1Anim, {
        toValue: -SCREEN_WIDTH,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setStep(1);
      step1Anim.setValue(SCREEN_WIDTH);
      Animated.spring(step1Anim, {
        toValue: 0,
        tension: 60,
        friction: 9,
        useNativeDriver: true,
      }).start();
    });
  };

  const goBack = () => {
    Animated.timing(step1Anim, {
      toValue: SCREEN_WIDTH,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setStep(0);
      step1Anim.setValue(-SCREEN_WIDTH);
      Animated.spring(step1Anim, {
        toValue: 0,
        tension: 60,
        friction: 9,
        useNativeDriver: true,
      }).start();
    });
  };

  const handleRegister = async () => {
    if (!password.trim() || !confirmPassword.trim()) {
      Alert.alert('Thông báo', 'Vui lòng điền đầy đủ thông tin');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Thông báo', 'Mật khẩu xác nhận không khớp');
      return;
    }
    setLoading(true);
    try {
      await authApi.register(email, password);
      Alert.alert('Thành công 🎉', 'Tài khoản đã được tạo thành công!', [
        { text: 'Đăng nhập ngay', onPress: () => navigation.navigate('Login') },
      ]);
    } catch (error: any) {
      Alert.alert('Đăng ký thất bại', error.message || 'Lỗi kết nối máy chủ');
    } finally {
      setLoading(false);
    }
  };

  const actionText = step === 0 ? 'Continue' : 'Create Account';
  const actionPress = step === 0 ? goToStep1 : handleRegister;

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

        <View pointerEvents="none" style={StyleSheet.absoluteFillObject}>
          <Image
            source={assets.cloud}
            style={styles.cloud}
            resizeMode="contain"
          />
          <Image
            source={assets.book}
            style={styles.book}
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
            source={assets.butterfly}
            style={styles.butterflyTop}
            resizeMode="contain"
          />

          <View style={[styles.panel, step === 1 && styles.panelPassword]}>
            <View style={styles.form}>
              <View style={styles.headerRow}>
                {step === 1 ? (
                  <TouchableOpacity
                    onPress={goBack}
                    style={styles.backBtn}
                    activeOpacity={0.75}
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
                  <Text style={styles.formTitle}>Create Account</Text>
                  <Text style={styles.formSubtitle}>
                    {step === 0
                      ? 'Step 1 / 2 - Email'
                      : 'Step 2 / 2 - Password'}
                  </Text>
                </View>
                <View style={styles.backBtnPlaceholder} />
              </View>

              <View style={styles.progressTrack}>
                <View
                  style={[
                    styles.progressFill,
                    step === 1 && styles.progressFillComplete,
                  ]}
                />
              </View>

              <View
                style={[
                  styles.stepWindow,
                  step === 1 && styles.stepWindowPassword,
                ]}
              >
                <Animated.View
                  style={{ transform: [{ translateX: step1Anim }] }}
                >
                  {step === 0 ? (
                    <View>
                      <TextInput
                        placeholder="Email"
                        placeholderTextColor="rgba(255,221,233,0.45)"
                        style={styles.input}
                        value={email}
                        onChangeText={setEmail}
                        autoCapitalize="none"
                        keyboardType="email-address"
                      />
                    </View>
                  ) : (
                    <View>
                      <TouchableOpacity
                        onPress={goBack}
                        style={styles.emailTag}
                        activeOpacity={0.75}
                      >
                        <Icon
                          name="checkmark-circle-outline"
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
                            name={
                              secureConfirm
                                ? 'eye-off-outline'
                                : 'eye-outline'
                            }
                            size={20}
                            color="rgba(255,221,233,0.72)"
                          />
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}
                </Animated.View>
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
                {loading && step === 1 ? (
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
              >
                <Text style={styles.linkText}>Back to Login</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      </ScrollView>

      <LoadingOverlay visible={loading} message="Creating Account..." />
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
    height: Math.min(Math.max(SCENE_HEIGHT * 0.3, 380), 460),
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
    width: '50%',
    height: '100%',
    borderRadius: 2,
    backgroundColor: 'rgba(255,184,211,0.86)',
  },
  progressFillComplete: {
    width: '100%',
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
    marginBottom: 2,
  },
  emailTagText: {
    flex: 1,
    color: 'rgba(255,221,233,0.72)',
    fontSize: 13,
    fontFamily: 'serif',
    fontWeight: 'bold',
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
    transform: [{ scale: 2 }, {rotate: '-6deg'}],
  },
  book: {
    position: 'absolute',
    left: 16,
    bottom: 40,
    width: Math.min(SCREEN_WIDTH * 0.62, 390),
    height: Math.min(SCREEN_WIDTH * 0.34, 220),
    zIndex: 2,
    transform: [{ scale: 2 }],
  },
  butterfly: {
    position: 'absolute',
    right: Math.max(24, SCREEN_WIDTH * 0.1),
    bottom: Math.max(158, SCENE_HEIGHT * 0.18),
    width: Math.min(SCREEN_WIDTH * 0.12, 70),
    height: Math.min(SCREEN_WIDTH * 0.12, 70),
    zIndex: 3,
    transform: [{ scaleX: -1.2 }, {scaleY: 1.2}],
    filter: 'drop-shadow(0px 0px 20px rgba(255, 155, 215, 1))',
  },
});

export default RegisterScreen;
