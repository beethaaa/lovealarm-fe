/* eslint-disable react-native/no-inline-styles */
import React, { useState, useRef, useEffect } from 'react';
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
    Animated,
    ViewStyle,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';

import COLOR_PALETTE from '../styles/colorPalette';
import { userService } from '../services/userService';

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

const ChangePasswordScreen = () => {
    const navigation = useNavigation();
    const [loading, setLoading] = useState(false);

    const [form, setForm] = useState({
        oldPassword: '',
        newPassword: '',
        confirmPassword: '',
    });

    const [showOld, setShowOld] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const fadeIn = useRef(new Animated.Value(0)).current;
    const slideUp = useRef(new Animated.Value(20)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeIn, {
                toValue: 1,
                duration: 500,
                useNativeDriver: true,
            }),
            Animated.spring(slideUp, {
                toValue: 0,
                tension: 60,
                friction: 10,
                useNativeDriver: true,
            }),
        ]).start();
    }, [fadeIn, slideUp]);

    const handleChangePassword = async () => {
        const { oldPassword, newPassword, confirmPassword } = form;

        if (!oldPassword || !newPassword || !confirmPassword) {
            Alert.alert('Lỗi', 'Vui lòng điền đầy đủ các trường');
            return;
        }

        // Validate length
        if (newPassword.length < 6) {
            Alert.alert('Lỗi', 'Mật khẩu mới phải có ít nhất 6 ký tự');
            return;
        }

        // Validate contain letter + numb
        const hasLetter = /[A-Za-z]/.test(newPassword);
        const hasNumber = /\d/.test(newPassword);
        if (!hasLetter || !hasNumber) {
            Alert.alert('Lỗi', 'Mật khẩu mới phải chứa cả chữ và số');
            return;
        }

        // Validate confirm match
        if (newPassword !== confirmPassword) {
            Alert.alert('Lỗi', 'Mật khẩu xác nhận không khớp');
            return;
        }

        try {
            setLoading(true);
            await userService.updatePassword({
                oldPassword,
                newPassword,
            });

            Alert.alert('Thành công !!!', 'Mật khẩu của bạn đã được cập nhật!', [
                { text: 'Xong', onPress: () => navigation.goBack() }
            ]);
        } catch (error: any) {
            const msg = error.response?.data?.message || 'Không thể đổi mật khẩu';
            Alert.alert('Thất bại', msg);
        } finally {
            setLoading(false);
        }
    };

    const EyeBtn = ({
        visible,
        onPress,
    }: {
        visible: boolean;
        onPress: () => void;
    }) => (
        <TouchableOpacity onPress={onPress} style={styles.eyeBtn}>
            <Icon
                name={visible ? 'eye-outline' : 'eye-off-outline'}
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

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Icon name="arrow-back" size={24} color={COLOR_PALETTE.pink} />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
                <Animated.View style={{ opacity: fadeIn, transform: [{ translateY: slideUp }] }}>
                    <Text style={styles.formTitle}>Đổi mật khẩu</Text>
                    <Text style={styles.formSubtitle}>
                        Tối thiểu 6 ký tự, bao gồm cả chữ và số
                    </Text>

                    <View style={styles.separator} />

                    <PinkInput
                        icon="key-outline"
                        label="MẬT KHẨU HIỆN TẠI"
                        placeholder="Nhập mật khẩu đang dùng"
                        value={form.oldPassword}
                        onChangeText={(val) => setForm({ ...form, oldPassword: val })}
                        secureTextEntry={!showOld}
                        rightElement={<EyeBtn visible={showOld} onPress={() => setShowOld(!showOld)} />}
                    />

                    <PinkInput
                        icon="lock-closed-outline"
                        label="MẬT KHẨU MỚI"
                        placeholder="Nhập mật khẩu mới"
                        value={form.newPassword}
                        onChangeText={(val) => setForm({ ...form, newPassword: val })}
                        secureTextEntry={!showNew}
                        rightElement={<EyeBtn visible={showNew} onPress={() => setShowNew(!showNew)} />}
                    />

                    <PinkInput
                        icon="shield-checkmark-outline"
                        label="XÁC NHẬN MẬT KHẨU"
                        placeholder="Nhập lại mật khẩu mới"
                        value={form.confirmPassword}
                        onChangeText={(val) => setForm({ ...form, confirmPassword: val })}
                        secureTextEntry={!showConfirm}
                        rightElement={<EyeBtn visible={showConfirm} onPress={() => setShowConfirm(!showConfirm)} />}
                    />

                    <TouchableOpacity
                        style={[styles.mainBtn, loading && { opacity: 0.6 }]}
                        onPress={handleChangePassword}
                        disabled={loading}
                        activeOpacity={0.85}
                    >
                        {loading ? (
                            <ActivityIndicator color={COLOR_PALETTE.pink} />
                        ) : (
                            <>
                                <Icon
                                    name="checkmark-circle"
                                    size={18}
                                    color={COLOR_PALETTE.pink}
                                    style={{ marginRight: 10 }}
                                />
                                <Text style={styles.mainBtnText}>Cập nhật mật khẩu</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </Animated.View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: '#0A0A0A' },

    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: Platform.OS === 'ios' ? 50 : 30,
        paddingHorizontal: 20,
        paddingBottom: 10,
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,194,209,0.07)',
        borderWidth: 1,
        borderColor: 'rgba(255,194,209,0.15)',
        alignItems: 'center',
        justifyContent: 'center',
    },

    container: {
        paddingHorizontal: 24,
        paddingTop: 20,
        paddingBottom: 50,
    },

    formTitle: {
        fontSize: 26,
        fontWeight: '900',
        color: COLOR_PALETTE.pink,
        letterSpacing: 0.3,
        textShadowColor: COLOR_PALETTE.brightPink,
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 10,
    },
    formSubtitle: {
        fontSize: 13,
        color: 'rgba(255,194,209,0.4)',
        fontWeight: '500',
        marginTop: 6,
        letterSpacing: 0.5,
    },

    separator: {
        height: 1,
        backgroundColor: 'rgba(255,194,209,0.08)',
        marginTop: 20,
        marginBottom: 28,
        ...({ boxShadow: '0px 0px 4px 0px rgba(255,194,209,0.15)' } as ViewStyle),
    },

    fieldGroup: { marginBottom: 24 },
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
    eyeBtn: { paddingLeft: 8, paddingRight: 4 },

    mainBtn: {
        height: 56,
        borderRadius: 28,
        backgroundColor: '#17050A',
        borderWidth: 1.5,
        borderColor: 'rgba(255,194,209,0.3)',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 16,
        ...({ boxShadow: 'inset 0px -2px 16px 0px #ffc2d1' } as ViewStyle),
    },
    mainBtnText: {
        color: COLOR_PALETTE.pink,
        fontSize: 16,
        fontWeight: '800',
        letterSpacing: 0.5,
        textTransform: 'uppercase',
    },
});

export default ChangePasswordScreen;