/* eslint-disable react-native/no-inline-styles */
import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Image,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    Alert,
    StatusBar,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation, useRoute } from '@react-navigation/native'; // Thêm useRoute

import COLOR_PALETTE from '../styles/colorPalette';
import { userService } from '../services/userService';
import { useAppStore } from '../store/appStore';

const ProfileScreen = () => {
    const route = useRoute<any>();
    const navigation = useNavigation<any>();
    const setLogout = useAppStore((state) => state.setLogout);

    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    // 1. Lắng nghe dữ liệu cập nhật từ màn hình EditProfile gửi về
    useEffect(() => {
        if (route.params?.updatedUser) {
            setUser(route.params.updatedUser);
        }
    }, [route.params?.updatedUser]);

    const fetchProfileData = async () => {
        try {
            setLoading(true);
            const response = await userService.getProfile();
            const userData = response?.data || response;
            setUser(userData);
        } catch (error: any) {
            console.error('Fetch Profile Error:', error);
            if (error.response?.status === 401) {
                handleLogout();
            } else {
                Alert.alert('Lỗi', 'Không thể tải thông tin cá nhân');
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProfileData();
    }, []);

    const handleLogout = async () => {
        Alert.alert('Đăng xuất', 'Bạn có chắc chắn muốn thoát?', [
            { text: 'Hủy', style: 'cancel' },
            {
                text: 'Đăng xuất',
                onPress: async () => {
                    await setLogout();
                }
            },
        ]);
    };

    if (loading && !user) {
        return (
            <View style={styles.loadingCenter}>
                <ActivityIndicator size="large" color={COLOR_PALETTE.pink} />
            </View>
        );
    }

    const profile = user?.profile || {};
    const displayName = profile.name || user?.name || 'User';
    const displayEmail = user?.email || '---';
    const displayBirthday = profile.birthday || '---';
    const displayAddress = user?.address || 'Chưa cập nhật';
    const displayInterests = profile.interest || [];

    return (
        <View style={styles.root}>
            <StatusBar barStyle="light-content" />

            <View style={styles.header}>
                <View style={styles.headerTitleRow}>
                    <Icon name="person-outline" size={20} color={COLOR_PALETTE.pink} />
                    <Text style={styles.headerTitle}>Your Profile</Text>
                </View>
                <TouchableOpacity onPress={() => navigation.navigate('EditProfile', { user: user })}>
                    <Icon name="create-outline" size={24} color={COLOR_PALETTE.pink} />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <View style={styles.avatarContainer}>
                    <View style={styles.avatarWrapper}>
                        <Image
                            source={{
                                uri: user?.avatarUrl || 'https://i.pinimg.com/736x/8f/11/49/8f114947963d7e5d8a8a2a8a2a8a2a8a.jpg'
                            }}
                            style={styles.avatarImage}
                        />
                        <TouchableOpacity style={styles.cameraBtn}>
                            <Icon name="camera" size={14} color="#FFF" />
                        </TouchableOpacity>
                    </View>
                    <Text style={styles.userName}>{displayName}</Text>
                </View>

                <View style={styles.infoSection}>
                    <InfoRow label="Your name" value={displayName} />
                    <InfoRow label="Email" value={displayEmail} />
                    <InfoRow label="Date of birth" value={displayBirthday} />
                    <InfoRow label="Address" value={displayAddress} />

                    <View style={styles.interestRow}>
                        <Text style={styles.infoLabel}>Interests</Text>
                        <View style={styles.tagContainer}>
                            {displayInterests.length > 0 ? (
                                displayInterests.map((item: string, index: number) => (
                                    <View
                                        key={index}
                                        style={[
                                            styles.tag,
                                            { backgroundColor: index % 3 === 0 ? '#A67B86' : index % 3 === 1 ? '#2D4B37' : '#4B4633' }
                                        ]}
                                    >
                                        <Text style={styles.tagText}>{item}</Text>
                                    </View>
                                ))
                            ) : (
                                <Text style={{ color: '#555', fontSize: 13 }}>No interests added</Text>
                            )}
                        </View>
                    </View>
                </View>

                <View style={styles.divider} />

                <View style={styles.footerActions}>
                    <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
                        <Icon name="log-out-outline" size={22} color={COLOR_PALETTE.pink} />
                        <Text style={styles.menuText}>Logout</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.menuItem}
                        onPress={() => navigation.navigate('ChangePassword')}
                    >
                        <Icon name="lock-closed-outline" size={22} color={COLOR_PALETTE.pink} />
                        <Text style={styles.menuText}>Change Password</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </View>
    );
};

const InfoRow = ({ label, value }: { label: string; value: string }) => (
    <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
    </View>
);

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: '#0A0A0A' },
    loadingCenter: { flex: 1, backgroundColor: '#0A0A0A', justifyContent: 'center', alignItems: 'center' },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 50,
        paddingBottom: 20,
    },
    headerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    headerTitle: { color: '#FFF', fontSize: 18, fontWeight: '700' },
    scrollContent: { paddingHorizontal: 20, paddingBottom: 100 },
    avatarContainer: { alignItems: 'center', marginVertical: 30 },
    avatarWrapper: {
        width: 140,
        height: 140,
        borderRadius: 70,
        borderWidth: 2,
        borderColor: 'rgba(255,194,209,0.3)',
        padding: 5,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarImage: { width: 130, height: 130, borderRadius: 65 },
    cameraBtn: {
        position: 'absolute',
        bottom: 5,
        right: 5,
        backgroundColor: '#222',
        width: 30,
        height: 30,
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#444',
    },
    userName: { color: '#FFF', fontSize: 22, fontWeight: '800', marginTop: 15 },
    infoSection: { marginTop: 20 },
    infoRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 25 },
    infoLabel: { color: COLOR_PALETTE.pink, opacity: 0.8, fontSize: 14, width: '40%' },
    infoValue: { color: '#FFF', fontSize: 14, fontWeight: '500', textAlign: 'left', flex: 1 },
    interestRow: { flexDirection: 'row', marginBottom: 25 },
    tagContainer: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', flex: 1 },
    tag: { paddingHorizontal: 15, paddingVertical: 6, borderRadius: 10 },
    tagText: { color: '#FFF', fontSize: 12, fontWeight: '600' },
    divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.1)', marginVertical: 10 },
    footerActions: { marginTop: 10 },
    menuItem: { flexDirection: 'row', alignItems: 'center', gap: 15, marginTop: 25 },
    menuText: { color: '#FFF', fontSize: 15, fontWeight: '600' },
});

export default ProfileScreen;