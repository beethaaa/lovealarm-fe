import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
    ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation, useRoute } from '@react-navigation/native';
import DatePicker from 'react-native-date-picker';
import COLOR_PALETTE from '../styles/colorPalette';
import { userService } from '../services/userService';

const AVAILABLE_INTERESTS = ['Music', 'Sport', 'Cooking', 'Travel', 'Reading', 'Movie', 'Gaming', 'Art', 'Tech', 'Fashion'];
const AVAILABLE_PERSONALITY = ['Creative', 'Outgoing', 'Introvert', 'Kind', 'Ambitious', 'Funny', 'Calm', 'Active'];

const EditProfileScreen = () => {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();

    const initialUser = route.params?.user;

    const [loading, setLoading] = useState(false);

    const [name, setName] = useState(initialUser?.profile?.name || '');
    const [gender, setGender] = useState(initialUser?.profile?.gender ?? 1);
    const [date, setDate] = useState(initialUser?.profile?.birthday ? new Date(initialUser.profile.birthday) : new Date());
    const [selectedInterests, setSelectedInterests] = useState<string[]>(initialUser?.profile?.interest || []);
    const [selectedTags, setSelectedTags] = useState<string[]>(initialUser?.profile?.personalityTags || []);
    const [open, setOpen] = useState(false);

    useEffect(() => {
        if (initialUser) {
            setName(initialUser.profile?.name || '');
            setGender(initialUser.profile?.gender ?? 1);
            if (initialUser.profile?.birthday) setDate(new Date(initialUser.profile.birthday));
            setSelectedInterests(initialUser.profile?.interest || []);
            setSelectedTags(initialUser.profile?.personalityTags || []);
        }
    }, [initialUser]);

    const toggleSelection = (item: string, list: string[], setList: (l: string[]) => void) => {
        if (list.includes(item)) {
            setList(list.filter((i) => i !== item));
        } else {
            setList([...list, item]);
        }
    };

    const formatDate = (date: Date) => {
        return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
    };

    const handleUpdate = async () => {
        if (!name.trim()) {
            Alert.alert('Lỗi', 'Vui lòng không để trống tên.');
            return;
        }

        try {
            setLoading(true);

            const updatedProfile = {
                ...initialUser?.profile,
                name: name.trim(),
                gender,
                birthday: formatDate(date),
                interest: selectedInterests,
                personalityTags: selectedTags,
            };

            const updateData = {
                profile: updatedProfile,
                address: initialUser?.address,
            };

            await userService.updateProfile(updateData);

            Alert.alert('Thành công', 'Hồ sơ đã được cập nhật', [
                {
                    text: 'Xong',
                    onPress: () => {
                        navigation.navigate('Profile', {
                            updatedUser: { ...initialUser, profile: updatedProfile }
                        });
                    }
                }
            ]);
        } catch (error) {
            Alert.alert('Lỗi', 'Không thể cập nhật thông tin.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.root}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Icon name="close" size={28} color="#FFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Edit Profile</Text>
                <TouchableOpacity onPress={handleUpdate} disabled={loading}>
                    {loading ? <ActivityIndicator color={COLOR_PALETTE.pink} /> : <Text style={styles.saveBtnText}>Save</Text>}
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.container}>
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Full Name</Text>
                    <TextInput
                        style={styles.input}
                        value={name}
                        onChangeText={setName}
                        placeholderTextColor="#444"
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Date of Birth</Text>
                    <TouchableOpacity
                        style={styles.dateSelector}
                        onPress={() => setOpen(true)}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.dateValue}>{formatDate(date)}</Text>
                        <Icon name="calendar-outline" size={22} color={COLOR_PALETTE.pink} />
                    </TouchableOpacity>

                    <DatePicker
                        modal
                        mode="date"
                        open={open}
                        date={date}
                        maximumDate={new Date()}
                        onConfirm={(date) => {
                            setOpen(false);
                            setDate(date);
                        }}
                        onCancel={() => setOpen(false)}
                        theme="dark"
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Gender</Text>
                    <View style={styles.row}>
                        {[{ label: 'Male', val: 1 }, { label: 'Female', val: 0 }].map((item) => (
                            <TouchableOpacity
                                key={item.val}
                                style={[styles.genderBtn, gender === item.val && styles.activeGenderBtn]}
                                onPress={() => setGender(item.val)}
                            >
                                <Text style={[styles.genderText, gender === item.val && styles.activeGenderText]}>{item.label}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Interests ({selectedInterests.length})</Text>
                    <View style={styles.chipContainer}>
                        {AVAILABLE_INTERESTS.map((item) => (
                            <TouchableOpacity
                                key={item}
                                onPress={() => toggleSelection(item, selectedInterests, setSelectedInterests)}
                                style={[styles.chip, selectedInterests.includes(item) && styles.activeChip]}
                            >
                                <Text style={[styles.chipText, selectedInterests.includes(item) && styles.activeChipText]}>{item}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Personality Tags</Text>
                    <View style={styles.chipContainer}>
                        {AVAILABLE_PERSONALITY.map((item) => (
                            <TouchableOpacity
                                key={item}
                                onPress={() => toggleSelection(item, selectedTags, setSelectedTags)}
                                style={[styles.tag, selectedTags.includes(item) && styles.activeTag]}
                            >
                                <Text style={[styles.tagText, selectedTags.includes(item) && styles.activeTagText]}>#{item}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: '#0A0A0A' },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 50,
        paddingBottom: 20,
        borderBottomWidth: 0.5,
        borderBottomColor: '#222',
    },
    headerTitle: { color: '#FFF', fontSize: 18, fontWeight: '700' },
    saveBtnText: { color: COLOR_PALETTE.pink, fontWeight: '700', fontSize: 16 },
    container: { padding: 20, paddingBottom: 50 },
    inputGroup: { marginBottom: 25 },
    label: { color: COLOR_PALETTE.pink, fontSize: 14, fontWeight: '600', marginBottom: 12 },
    input: {
        backgroundColor: '#161616',
        color: '#FFF',
        borderRadius: 12,
        padding: 15,
        fontSize: 16,
        borderWidth: 1,
        borderColor: '#333',
    },
    dateSelector: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#161616',
        borderRadius: 12,
        padding: 15,
        borderWidth: 1,
        borderColor: '#333',
    },
    dateValue: { color: '#FFF', fontSize: 16 },
    row: { flexDirection: 'row', gap: 12 },
    genderBtn: {
        flex: 1,
        padding: 12,
        borderRadius: 10,
        backgroundColor: '#161616',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#333',
    },
    activeGenderBtn: { backgroundColor: 'rgba(236, 72, 153, 0.15)', borderColor: COLOR_PALETTE.pink },
    genderText: { color: '#888', fontWeight: '600' },
    activeGenderText: { color: COLOR_PALETTE.pink },
    chipContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    chip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#161616',
        borderWidth: 1,
        borderColor: '#333',
    },
    activeChip: { backgroundColor: COLOR_PALETTE.pink, borderColor: COLOR_PALETTE.pink },
    chipText: { color: '#EEE', fontSize: 13 },
    activeChipText: { color: '#FFF', fontWeight: '700' },
    tag: {
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderRadius: 8,
        backgroundColor: '#222',
    },
    activeTag: { backgroundColor: '#444', borderWidth: 1, borderColor: COLOR_PALETTE.pink },
    tagText: { color: '#AAA', fontSize: 13 },
    activeTagText: { color: COLOR_PALETTE.pink, fontWeight: '700' },
});

export default EditProfileScreen;