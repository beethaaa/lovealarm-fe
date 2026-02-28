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
    // 1. Kiểm tra đầu vào cơ bản
    if (!email.trim() || !password.trim()) {
      Alert.alert('Thông báo', 'Vui lòng điền đầy đủ thông tin');
      return;
    }

    setLoading(true);
    try {
      // 2. Gọi API Login
      const responseData = await authApi.login(email, password);

      // LOG DEBUG: Dòng này cực kỳ quan trọng để bạn nhìn thấy Backend trả về cái gì ở Terminal
      console.log('--- LOGIN RESPONSE DATA ---', responseData);

      // 3. Lấy token với nhiều trường hợp (vét cạn)
      // Lưu ý: Nếu responseData chính là chuỗi token (string), nó sẽ lấy luôn
      const token =
        (typeof responseData === 'string' ? responseData : null) ||
        responseData?.access_token ||
        responseData?.accessToken ||
        responseData?.token ||
        responseData?.data?.token ||
        responseData?.data?.access_token;

      if (token) {
        console.log('Token tìm thấy:', token);
        await setLogin(token);
        // Sau lệnh này, AppNavigator sẽ tự động đổi màn hình nhờ vào logic isLoggedIn
      } else {
        // Trường hợp đăng nhập đúng (200 OK) nhưng cấu trúc JSON không có token
        console.error('Không tìm thấy token trong cấu trúc:', responseData);
        Alert.alert(
          'Lỗi dữ liệu',
          'Đăng nhập thành công nhưng server trả về cấu trúc không hợp lệ.',
        );
      }
    } catch (error: any) {
      // 4. Xử lý lỗi (Sai pass, Server die, Timeout...)
      console.error('Login Error:', error);
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
      <Image
        source={require('../assets/LoginPage.png')}
        style={styles.backgroundImage}
        resizeMode="cover"
      />

      <View style={styles.overlay}>
        <Text style={styles.title}>LOVE ALARM</Text>

        <View style={styles.inputContainer}>
          {/* Input Email */}
          <View style={styles.inputWrapper}>
            <MaterialCommunityIcons
              name="email-outline"
              size={20}
              color={COLOR_PALETTE.brightPink}
            />
            <TextInput
              placeholder="Email"
              placeholderTextColor="rgba(255,255,255,0.4)"
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>

          {/* Input Password */}
          <View style={styles.inputWrapper}>
            <MaterialCommunityIcons
              name="lock-outline"
              size={20}
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
                name={secureText ? 'eye-outline' : 'eye-off-outline'}
                size={20}
                color="rgba(255,255,255,0.6)"
              />
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.loginButton, { opacity: loading ? 0.7 : 1 }]}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.loginButtonText}>LOGIN</Text>
          )}
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Don't have an account? </Text>
          <TouchableOpacity>
            <Text style={styles.signUpText}>Sign Up</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

// ... Styles giữ nguyên như cũ ...
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  backgroundImage: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    opacity: 0.9,
  },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 35,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 50,
    letterSpacing: 4,
  },
  inputContainer: { width: '100%', gap: 15 },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    height: 55,
    borderWidth: 1.5,
    borderColor: COLOR_PALETTE.roseRed,
    borderRadius: 15,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 15,
  },
  input: { flex: 1, color: 'white', paddingHorizontal: 10, fontSize: 16 },
  loginButton: {
    width: '100%',
    height: 55,
    borderRadius: 27,
    marginTop: 40,
    backgroundColor: COLOR_PALETTE.brightPink,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginButtonText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  footer: { flexDirection: 'row', marginTop: 30 },
  footerText: { color: '#bbb' },
  signUpText: { color: COLOR_PALETTE.brightPink, fontWeight: 'bold' },
});

export default LoginScreen;
