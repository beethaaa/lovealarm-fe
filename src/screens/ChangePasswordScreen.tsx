/* eslint-disable react-native/no-inline-styles */
import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
    StatusBar,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';

import COLOR_PALETTE from '../styles/colorPalette';
import { userService } from '../services/userService';

const ChangePasswordScreen = () => {
    const navigation = useNavigation();
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({
        oldPassword: '',
        newPassword: '',
        confirmPassword: '',
    });

    const handleChangePassword = async () => {
        const { oldPassword, newPassword, confirmPassword } = form;

        if (!oldPassword || !newPassword || !confirmPassword) {
            Alert.alert('Lỗi', 'Vui lòng điền đầy đủ các trường');
            return;
        }

        if (newPassword.length < 6) {
            Alert.alert('Lỗi', 'Mật khẩu mới phải có ít nhất 6 ký tự');
            return;
        }

        if (newPassword !== confirmPassword) {
            Alert.alert('Lỗi', 'Mật khẩu mới không khớp');
            return;
        }

        try {
            setLoading(true);
            await userService.updatePassword({
                oldPassword,
                newPassword,
            });

            Alert.alert('Thành công', 'Mật khẩu đã được thay đổi', [
                { text: 'OK', onPress: () => navigation.goBack() }
            ]);
        } catch (error: any) {
            const msg = error.response?.data?.message || 'Không thể đổi mật khẩu';
            Alert.alert('Thất bại', msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.root}
        >
            <StatusBar barStyle="light-content" />

            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Icon name="chevron-back" size={28} color={COLOR_PALETTE.pink} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Change Password</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.container}>
                <View style={styles.infoBox}>
                    <Icon name="shield-checkmark-outline" size={20} color={COLOR_PALETTE.pink} />
                    <Text style={styles.desc}>
                        Mật khẩu mới phải có ít nhất 6 ký tự để đảm bảo an toàn cho tài khoản của bạn.
                    </Text>
                </View>

                <PasswordField
                    label="Current Password"
                    value={form.oldPassword}
                    onChange={(val: string) => setForm({ ...form, oldPassword: val })}
                />

                <PasswordField
                    label="New Password"
                    value={form.newPassword}
                    onChange={(val: string) => setForm({ ...form, newPassword: val })}
                />

                <PasswordField
                    label="Confirm New Password"
                    value={form.confirmPassword}
                    onChange={(val: string) => setForm({ ...form, confirmPassword: val })}
                />

                <TouchableOpacity
                    style={[styles.btn, loading && { opacity: 0.7 }]}
                    onPress={handleChangePassword}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#FFF" />
                    ) : (
                        <Text style={styles.btnText}>Update Password</Text>
                    )}
                </TouchableOpacity>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const PasswordField = ({ label, value, onChange }: any) => {
    const [show, setShow] = useState(false);
    const [isFocused, setIsFocused] = useState(false);

    return (
        <View style={styles.inputGroup}>
            <Text style={styles.label}>{label}</Text>
            <View style={[
                styles.inputWrapper,
                isFocused && styles.inputWrapperFocused
            ]}>
                <TextInput
                    style={styles.input}
                    secureTextEntry={!show}
                    value={value}
                    onChangeText={onChange}
                    placeholder="••••••••"
                    placeholderTextColor="#444"
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                />
                <TouchableOpacity onPress={() => setShow(!show)} style={styles.eyeBtn}>
                    <Icon
                        name={show ? "eye-off-outline" : "eye-outline"}
                        size={20}
                        color={show ? COLOR_PALETTE.pink : "#666"}
                    />
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: '#0A0A0A' },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 50,
        paddingHorizontal: 15,
        paddingBottom: 20,
    },
    backBtn: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: '700',
        letterSpacing: 0.5
    },
    container: { padding: 25 },
    infoBox: {
        flexDirection: 'row',
        backgroundColor: '#161616',
        padding: 15,
        borderRadius: 12,
        marginBottom: 30,
        alignItems: 'center',
        gap: 12,
        borderWidth: 1,
        borderColor: '#222'
    },
    desc: {
        color: '#AAA',
        fontSize: 13,
        lineHeight: 18,
        flex: 1
    },
    inputGroup: { marginBottom: 25 },
    label: {
        color: COLOR_PALETTE.pink,
        marginBottom: 10,
        fontSize: 14,
        fontWeight: '600',
        opacity: 0.9
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#161616',
        borderRadius: 12,
        paddingHorizontal: 15,
        borderWidth: 1,
        borderColor: '#333',
    },
    inputWrapperFocused: {
        borderColor: COLOR_PALETTE.pink,
        backgroundColor: 'rgba(255,194,209,0.05)'
    },
    input: {
        flex: 1,
        paddingVertical: 15,
        color: '#FFF',
        fontSize: 16
    },
    eyeBtn: {
        padding: 5,
    },
    btn: {
        backgroundColor: COLOR_PALETTE.pink,
        borderRadius: 15,
        padding: 18,
        alignItems: 'center',
        marginTop: 20,
        shadowColor: COLOR_PALETTE.pink,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    btnText: {
        color: '#FFF',
        fontWeight: '800',
        fontSize: 16,
        textTransform: 'uppercase',
        letterSpacing: 1
    },
});

export default ChangePasswordScreen;