import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import COLOR_PALETTE from '../styles/colorPalette';
import { authApi } from '../services/authService';
import { useAppStore } from '../store/appStore';

const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [secureText, setSecureText] = useState(true);
  const setLogin = useAppStore(state => state.setLogin);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Thông báo', 'Vui lòng điền đầy đủ thông tin');
      return;
    }

    setLoading(true);
    try {
      const responseData = await authApi.login(email, password);
      const token =
        (typeof responseData === 'string' ? responseData : null) ||
        responseData?.access_token ||
        responseData?.accessToken ||
        responseData?.token ||
        responseData?.data?.token;

      if (token) {
        await setLogin(token);
      } else {
        Alert.alert(
          'Lỗi dữ liệu',
          'Đăng nhập thành công nhưng không tìm thấy mã xác thực.',
        );
      }
    } catch (error: any) {
      // Alert.alert('Đăng nhập thất bại', error.message || 'Lỗi kết nối máy chủ');
      Alert.alert('Đăng nhập thất bại', error.message || 'Lỗi kết nối máy chủ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.overlay}>
        {/* 1. LOVE ALARM */}
        <Text style={styles.title}>LOVE ALARM</Text>

        {/* 2. IMG */}
        <View style={styles.heartContainer}>
          <Image
            source={require('../assets/LoginPage.png')}
            style={styles.heartImage}
            resizeMode="contain"
          />
        </View>

        {/* 3. INPUT */}
        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <MaterialCommunityIcons
              name="email-outline"
              size={22}
              color={COLOR_PALETTE.brightPink}
            />
            <TextInput
              placeholder="Email"
              placeholderTextColor="rgba(255,255,255,0.4)"
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputWrapper}>
            <MaterialCommunityIcons
              name="lock-outline"
              size={22}
              color={COLOR_PALETTE.brightPink}
            />
            <TextInput
              placeholder="Mật khẩu"
              placeholderTextColor="rgba(255,255,255,0.4)"
              style={styles.input}
              secureTextEntry={secureText}
              value={password}
              onChangeText={setPassword}
            />
            <TouchableOpacity onPress={() => setSecureText(!secureText)}>
              <Ionicons
                name={secureText ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color="white"
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.forgotBtn}>
            <Text style={styles.forgotText}>Quên mật khẩu?</Text>
          </TouchableOpacity>
        </View>

        {/* 4. BUTTON */}
        <TouchableOpacity
          style={[styles.loginButton, { opacity: loading ? 0.7 : 1 }]}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.loginButtonText}>Đăng nhập</Text>
          )}
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Chưa có tài khoản? </Text>
          <TouchableOpacity>
            <Text style={styles.signUpText}>Đăng ký ngay</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  overlay: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 35,
    paddingTop: 80,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: COLOR_PALETTE.brightPink,
    letterSpacing: 4,
    marginBottom: 15,
  },
  heartContainer: {
    width: '100%',
    height: 250,
    justifyContent: 'center',
    alignItems: 'center',
    // marginBottom: 10,
    marginTop: 40,
  },
  heartImage: {
    width: '300%',
    height: '300%',
  },
  inputContainer: {
    width: '100%',
    marginTop: 10,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    height: 55,
    borderWidth: 1.5,
    borderColor: COLOR_PALETTE.roseRed,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 15,
    marginBottom: 15,
  },
  input: { flex: 1, color: 'white', paddingHorizontal: 10, fontSize: 16 },
  forgotBtn: { alignSelf: 'flex-end', marginTop: -5, marginBottom: 25 },
  forgotText: { color: 'rgba(255,255,255,0.6)', fontSize: 14 },
  loginButton: {
    width: '100%',
    height: 55,
    borderRadius: 30,
    backgroundColor: COLOR_PALETTE.brightPink,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
  },
  loginButtonText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  footer: { flexDirection: 'row', marginTop: 40 },
  footerText: { color: 'rgba(255,255,255,0.7)' },
  signUpText: { color: COLOR_PALETTE.brightPink, fontWeight: 'bold' },
});

export default LoginScreen;
