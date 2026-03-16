/* eslint-disable react/no-unstable-nested-components */
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

const ProgressBar = ({ step }: { step: number }) => {
  const progress = useRef(new Animated.Value(0.5)).current;
  useEffect(() => {
    Animated.spring(progress, {
      toValue: step === 0 ? 0.5 : 1,
      tension: 60,
      friction: 8,
      useNativeDriver: false,
    }).start();
  }, [step, progress]);
  const width = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });
  return (
    <View style={styles.progressTrack}>
      <Animated.View style={[styles.progressFill, { width }]} />
    </View>
  );
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
        toValue: -SW,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setStep(1);
      step1Anim.setValue(SW);
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
      toValue: SW,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setStep(0);
      step1Anim.setValue(-SW);
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

  const EyeBtn = ({
    secure,
    onPress,
  }: {
    secure: boolean;
    onPress: () => void;
  }) => (
    <TouchableOpacity onPress={onPress} style={styles.eyeBtn}>
      <Icon
        name={secure ? 'eye-off-outline' : 'eye-outline'}
        size={19}
        color="rgba(255,194,209,0.45)"
      />
    </TouchableOpacity>
  );

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
        {/* Top radar */}
        <RadarSection />

        {/* Form section */}
        <Animated.View
          style={[
            styles.formSection,
            { opacity: fadeIn, transform: [{ translateY: slideUp }] },
          ]}
        >
          {/* Header */}
          <View style={styles.formHeader}>
            <View style={styles.formHeaderLeft}>
              {step === 1 && (
                <TouchableOpacity onPress={goBack} style={styles.backBtn}>
                  <Icon
                    name="arrow-back"
                    size={20}
                    color={COLOR_PALETTE.pink}
                  />
                </TouchableOpacity>
              )}
              <View>
                <Text style={styles.formTitle}>Tạo tài khoản</Text>
                <Text style={styles.formSubtitle}>
                  {step === 0 ? 'Bước 1 / 2 — Email' : 'Bước 2 / 2 — Mật khẩu'}
                </Text>
              </View>
            </View>
          </View>

          {/* Progress */}
          <ProgressBar step={step} />

          {/* Fields */}
          <Animated.View style={{ transform: [{ translateX: step1Anim }] }}>
            {step === 0 ? (
              <>
                <PinkInput
                  icon="mail-outline"
                  label="ĐỊA CHỈ EMAIL"
                  placeholder="you@example.com"
                  value={email}
                  onChangeText={setEmail}
                />

                <TouchableOpacity
                  style={styles.mainBtn}
                  onPress={goToStep1}
                  activeOpacity={0.85}
                >
                  <Text style={styles.mainBtnText}>Tiếp tục</Text>
                  <Icon
                    name="arrow-forward"
                    size={18}
                    color={COLOR_PALETTE.pink}
                    style={{ marginLeft: 10 }}
                  />
                </TouchableOpacity>
              </>
            ) : (
              <>
                {/* Email recap */}
                <TouchableOpacity onPress={goBack} style={styles.emailTag}>
                  <Icon
                    name="checkmark-circle"
                    size={15}
                    color={COLOR_PALETTE.pink}
                  />
                  <Text style={styles.emailTagText} numberOfLines={1}>
                    {email}
                  </Text>
                  <Icon
                    name="pencil-outline"
                    size={13}
                    color="rgba(255,194,209,0.4)"
                  />
                </TouchableOpacity>

                <PinkInput
                  icon="lock-closed-outline"
                  label="MẬT KHẨU"
                  placeholder="Tối thiểu 8 ký tự"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={secureText}
                  rightElement={
                    <EyeBtn
                      secure={secureText}
                      onPress={() => setSecureText(!secureText)}
                    />
                  }
                />

                <PinkInput
                  icon="shield-checkmark-outline"
                  label="XÁC NHẬN MẬT KHẨU"
                  placeholder="Nhập lại mật khẩu"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={secureConfirm}
                  rightElement={
                    <EyeBtn
                      secure={secureConfirm}
                      onPress={() => setSecureConfirm(!secureConfirm)}
                    />
                  }
                />

                <TouchableOpacity
                  style={[styles.mainBtn, loading && { opacity: 0.6 }]}
                  onPress={handleRegister}
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
                      <Text style={styles.mainBtnText}>Tạo tài khoản</Text>
                    </>
                  )}
                </TouchableOpacity>
              </>
            )}
          </Animated.View>

          {/* Footer */}
          <View style={styles.footerRow}>
            <View style={styles.footerDivider} />
            <TouchableOpacity
              style={styles.footerLink}
              onPress={() => navigation.navigate('Login')}
            >
              <Text style={styles.footerLinkText}>Đã có tài khoản? </Text>
              <Text style={styles.footerLinkHighlight}>Đăng nhập</Text>
            </TouchableOpacity>
            <View style={styles.footerDivider} />
          </View>
        </Animated.View>
      </ScrollView>
      <LoadingOverlay visible={loading} message="Creating Account..." />
    </KeyboardAvoidingView>
  );
};

export default RegisterScreen;

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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  formHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,194,209,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(255,194,209,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
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
    marginTop: 2,
    letterSpacing: 0.5,
  },

  progressTrack: {
    height: 2,
    backgroundColor: 'rgba(255,194,209,0.1)',
    borderRadius: 2,
    marginBottom: 28,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLOR_PALETTE.pink,
    borderRadius: 2,
    ...({ boxShadow: '0px 0px 6px 0px #ffc2d1' } as ViewStyle),
  },

  fieldGroup: {
    marginBottom: 20,
  },
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

  emailTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,194,209,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,194,209,0.15)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 24,
    ...({
      boxShadow: 'inset 0px -1px 4px 0px rgba(255,194,209,0.08)',
    } as ViewStyle),
  },
  emailTagText: {
    flex: 1,
    color: COLOR_PALETTE.pink,
    fontSize: 13,
    fontWeight: '600',
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
    ...({ boxShadow: 'inset 0px -2px 16px 0px #ffc2d1' } as ViewStyle),
  },
  mainBtnText: {
    color: COLOR_PALETTE.pink,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
  },

  // ── Footer ──
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
