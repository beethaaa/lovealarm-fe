/* eslint-disable react-native/no-inline-styles */
import React, { useState, useCallback } from 'react';
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
    ViewStyle,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';

import COLOR_PALETTE from '../styles/colorPalette';
import { userService } from '../services/userService';
import { useAppStore } from '../store/appStore';

const formatDate = (raw: string | undefined): string => {
    if (!raw) return '---';
    const d = new Date(raw);
    if (isNaN(d.getTime())) return '---';
    const months = [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
    ];
    const day = d.getDate();
    const suffix =
        day === 1 || day === 21 || day === 31
            ? 'st'
            : day === 2 || day === 22
                ? 'nd'
                : day === 3 || day === 23
                    ? 'rd'
                    : 'th';
    return `${months[d.getMonth()]}, ${day}${suffix} ${d.getFullYear()}`;
};

const GENDER_LABELS: Record<number, string> = { 0: 'Male', 1: 'Female', 2: 'Other' };


const ProfileScreen = () => {
    const navigation = useNavigation<any>();
    const setLogout = useAppStore((state) => state.setLogout);

    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const handleLogout = async () => {
        Alert.alert('Đăng xuất', 'Bạn có chắc chắn muốn thoát?', [
            { text: 'Hủy', style: 'cancel' },
            {
                text: 'Đăng xuất',
                onPress: async () => {
                    await setLogout();
                },
            },
        ]);
    };

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

    useFocusEffect(
        useCallback(() => {
            fetchProfileData();
            // eslint-disable-next-line react-hooks/exhaustive-deps
        }, []),
    );


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
    const displayBirthday = formatDate(profile.birthday);
    const displayInterests: string[] = profile.interest || [];
    const displayPersonality: string[] = profile.personalityTags || [];
    const displayGender =
        profile.gender !== undefined && profile.gender !== null
            ? GENDER_LABELS[profile.gender] ?? '---'
            : '---';
    const displayStartFrom = formatDate(user?.createdAt);

    return (
        <View style={styles.root}>
            <StatusBar barStyle="light-content" />

            <View style={styles.header}>
                <View style={styles.headerTitleRow}>
                    <Icon name="person-outline" size={20} color={COLOR_PALETTE.pink} />
                    <Text style={styles.headerTitle}>Your Profile</Text>
                </View>

                <TouchableOpacity
                    style={styles.editBtn}
                    onPress={() => navigation.navigate('EditProfile', { user })}
                    activeOpacity={0.75}
                >
                    <Icon name="create-outline" size={20} color={COLOR_PALETTE.pink} style={{ opacity: 0.7 }} />
                </TouchableOpacity>
            </View>

            <View style={styles.dividerLine} />

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >

                <View style={styles.avatarContainer}>
                    <View style={styles.avatarRing}>
                        <Image
                            source={{
                                uri:
                                    user?.avatarUrl ||
                                    'https://i.pinimg.com/736x/8f/11/49/8f114947963d7e5d8a8a2a8a2a8a2a8a.jpg',
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
                    <InfoRow label="Gender" value={displayGender} />

                    <View style={styles.tagRow}>
                        <Text style={styles.infoLabel}>Interests</Text>
                        <View style={styles.tagContainer}>
                            {displayInterests.length > 0 ? (
                                displayInterests.map((item: string, i: number) => (
                                    <View key={i} style={styles.tag}>
                                        <Text style={styles.tagText}>{item}</Text>
                                    </View>
                                ))
                            ) : (
                                <Text style={styles.emptyTag}>No interests added</Text>
                            )}
                        </View>
                    </View>

                    {displayPersonality.length > 0 && (
                        <View style={styles.tagRow}>
                            <Text style={styles.infoLabel}>Personality</Text>
                            <View style={styles.tagContainer}>
                                {displayPersonality.map((item: string, i: number) => (
                                    <View key={i} style={styles.personalityTag}>
                                        <Text style={styles.tagText}>#{item}</Text>
                                    </View>
                                ))}
                            </View>
                        </View>
                    )}
                </View>

                <View style={styles.divider} />

                <View style={styles.startFromWrapper}>
                    <InfoRow label="Start from" value={displayStartFrom} />
                </View>

                <View style={styles.divider} />

                <View style={styles.footerActions}>

                    <TouchableOpacity
                        style={styles.menuItem}
                        onPress={() => navigation.navigate('ChangePassword')}
                    >
                        <Icon name="lock-closed-outline" size={22} color={COLOR_PALETTE.pink} />
                        <Text style={styles.menuText}>Change Password</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
                        <Icon name="log-out-outline" size={22} color={COLOR_PALETTE.pink} />
                        <Text style={styles.menuText}>Logout</Text>
                    </TouchableOpacity>
                </View>

                <View style={{ height: 200 }} />
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
    loadingCenter: {
        flex: 1,
        backgroundColor: '#0A0A0A',
        justifyContent: 'center',
        alignItems: 'center',
    },

    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 50,
        paddingBottom: 18,
    },
    headerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    headerTitle: { color: '#FFF', fontSize: 18, fontWeight: '700' },
    dividerLine: {
        height: 1.5,
        backgroundColor: 'rgba(255,255,255,0.25)',
        marginHorizontal: 20,
    },

    editBtn: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#17050A',
        borderWidth: 1.5,
        borderColor: 'rgba(255,194,209,0.3)',
        alignItems: 'center',
        justifyContent: 'center',
        ...({ boxShadow: 'inset 0px -1px 3px 0px #ffc2d1' } as ViewStyle),
    },

    scrollContent: { paddingHorizontal: 20, paddingTop: 10 },

    avatarContainer: { alignItems: 'center', marginVertical: 28 },
    avatarRing: {
        width: 130,
        height: 130,
        borderRadius: 65,
        borderWidth: 2,
        borderColor: 'rgba(255,194,209,0.35)',
        padding: 4,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarImage: { width: 120, height: 120, borderRadius: 60 },
    cameraBtn: {
        position: 'absolute',
        bottom: 4,
        right: 4,
        backgroundColor: '#222',
        width: 30,
        height: 30,
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: 'rgba(255,194,209,0.4)',
    },
    userName: { color: '#FFF', fontSize: 22, fontWeight: '800', marginTop: 14 },

    infoSection: { marginTop: 10 },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 22,
        alignItems: 'flex-start',
    },
    infoLabel: {
        color: COLOR_PALETTE.pink,
        opacity: 0.85,
        fontSize: 14,
        width: '38%',
    },
    infoValue: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: '500',
        flex: 1,
    },

    tagRow: {
        flexDirection: 'row',
        marginBottom: 22,
        alignItems: 'flex-start',
    },
    tagContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        flex: 1,
    },
    tag: {
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderRadius: 20,
        backgroundColor: 'transparent',
        borderWidth: 1.5,
        borderColor: COLOR_PALETTE.salmonPink,
    },
    personalityTag: {
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderRadius: 20,
        backgroundColor: 'transparent',
        borderWidth: 1.5,
        borderColor: COLOR_PALETTE.salmonPink,
    },
    tagText: { color: '#FFF', fontSize: 12, fontWeight: '600' },
    emptyTag: { color: '#555', fontSize: 13 },

    divider: {
        height: 1.5,
        backgroundColor: 'rgba(255,255,255,0.22)',
        marginVertical: 0,
    },
    startFromWrapper: {
        paddingVertical: 15,
        marginBottom: -20,
    },

    footerActions: { marginTop: 10 },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 15,
        marginTop: 22,
    },
    menuText: { color: '#FFF', fontSize: 15, fontWeight: '600' },
});

export default ProfileScreen;