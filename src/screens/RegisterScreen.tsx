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

const RegisterScreen = ({ navigation }: any) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [secureText, setSecureText] = useState(true);

  const handleRegister = async () => {
    if (!email.trim() || !password.trim() || !confirmPassword.trim()) {
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
      Alert.alert('Thành công', 'Tài khoản đã được tạo thành công!', [
        { text: 'Đăng nhập ngay', onPress: () => navigation.navigate('Login') },
      ]);
    } catch (error: any) {
      Alert.alert('Đăng ký thất bại', error.message || 'Lỗi kết nối máy chủ');
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
        <Text style={styles.title}>LOVE ALARM</Text>

        <View style={styles.heartContainer}>
          <Image
            source={require('../assets/LoginPage.png')}
            style={styles.heartImage}
            resizeMode="contain"
          />
        </View>

        <Text style={styles.subtitle}>Tạo tài khoản</Text>

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

          <View style={styles.inputWrapper}>
            <MaterialCommunityIcons
              name="lock-check-outline"
              size={22}
              color={COLOR_PALETTE.brightPink}
            />
            <TextInput
              placeholder="Xác nhận mật khẩu"
              placeholderTextColor="rgba(255,255,255,0.4)"
              style={styles.input}
              secureTextEntry={secureText}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />
          </View>
        </View>

        <TouchableOpacity
          style={styles.registerButton}
          onPress={handleRegister}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.buttonText}>Sign Up</Text>
          )}
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Bạn đã có tài khoản? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.loginText}>Đăng nhập</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  overlay: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 35,
    paddingTop: 60,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: COLOR_PALETTE.brightPink,
    letterSpacing: 4,
    marginTop: 20,
  },
  heartContainer: {
    width: '100%',
    height: 180,
    marginTop: 70,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heartImage: { width: '400%', height: '400%' },
  subtitle: {
    color: COLOR_PALETTE.brightPink,
    fontSize: 18,
    marginVertical: 15,
    fontWeight: '500',
  },
  inputContainer: { width: '100%' },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 55,
    borderWidth: 1.5,
    borderColor: COLOR_PALETTE.roseRed,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 77, 109, 0.08)',
    paddingHorizontal: 15,
    marginBottom: 12,
  },
  input: { flex: 1, color: 'white', paddingHorizontal: 10 },
  registerButton: {
    width: '100%',
    height: 55,
    borderRadius: 30,
    backgroundColor: COLOR_PALETTE.brightPink,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    elevation: 5,
  },
  buttonText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  footer: { flexDirection: 'row', marginTop: 30 },
  footerText: { color: 'rgba(255,255,255,0.7)' },
  loginText: { color: COLOR_PALETTE.brightPink, fontWeight: 'bold' },
});

export default RegisterScreen;
