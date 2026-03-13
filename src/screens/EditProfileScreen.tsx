/* eslint-disable react-native/no-inline-styles */
import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
    ScrollView,
    TouchableWithoutFeedback,
    Keyboard,
    Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation, useRoute } from '@react-navigation/native';
import DatePicker from 'react-native-date-picker';
import COLOR_PALETTE from '../styles/colorPalette';
import { userService } from '../services/userService';

const AVAILABLE_PERSONALITY = [
    'Creative', 'Outgoing', 'Introvert', 'Kind',
    'Ambitious', 'Funny', 'Calm', 'Active', 'Adventurous', 'Romantic',
];

const GENDER_OPTIONS = [
    { label: 'Male', val: 0 },
    { label: 'Female', val: 1 },
];

/* SelectedChip Cho Interest + Personaltag */
const SelectedChip = ({
    label,
    onRemove,
    color,
}: {
    label: string;
    onRemove: () => void;
    color: string;
}) => (
    <View style={[styles.selectedChip, { borderColor: color }]}>
        <Text style={[styles.selectedChipText, { color: '#FFF' }]}>{label}</Text>
        <TouchableOpacity onPress={onRemove} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
            <Icon name="close-circle" size={16} color={color} style={{ marginLeft: 5 }} />
        </TouchableOpacity>
    </View>
);

/* ─── Search + Select DropDown ─── */
interface SearchDropdownProps {
    label: string;
    selected: string[];
    allOptions: string[];
    onSelect: (item: string) => void;
    onRemove: (item: string) => void;
    chipColor: string;
    allowAdd?: boolean;
    placeholder?: string;
}

const SearchDropdown = ({
    label,
    selected,
    allOptions,
    onSelect,
    onRemove,
    chipColor,
    allowAdd = true,
    placeholder = 'Search...',
}: SearchDropdownProps) => {
    const [search, setSearch] = useState('');
    const [open, setOpen] = useState(false);
    const inputRef = useRef<TextInput>(null);

    const filtered = allOptions.filter(
        (o) =>
            o.toLowerCase().includes(search.toLowerCase()) &&
            !selected.includes(o),
    );

    const showAddButton =
        allowAdd &&
        search.trim().length > 0 &&
        filtered.length === 0 &&
        !selected.includes(search.trim());

    const handleSelect = (item: string) => {
        onSelect(item);
        setSearch('');
        setOpen(false);
        Keyboard.dismiss();
    };

    const handleAdd = () => {
        const trimmed = search.trim();
        if (trimmed) {
            onSelect(trimmed);
            setSearch('');
            setOpen(false);
            Keyboard.dismiss();
        }
    };

    return (
        <View style={styles.inputGroup}>
            <Text style={styles.label}>
                {label} ({selected.length})
            </Text>

            {/* Selected chips */}
            {selected.length > 0 && (
                <View style={styles.chipRow}>
                    {selected.map((item) => (
                        <SelectedChip
                            key={item}
                            label={item}
                            color={chipColor}
                            onRemove={() => onRemove(item)}
                        />
                    ))}
                </View>
            )}

            {/* Search bar */}
            <View style={styles.searchBarWrapper}>
                <Icon name="search-outline" size={18} color="#888" style={{ marginRight: 8 }} />
                <TextInput
                    ref={inputRef}
                    style={styles.searchInput}
                    value={search}
                    onChangeText={(t) => {
                        setSearch(t);
                        setOpen(true);
                    }}
                    onFocus={() => setOpen(true)}
                    placeholder={placeholder}
                    placeholderTextColor="#555"
                />
                {(search.length > 0 || open) && (
                    <TouchableOpacity
                        onPress={() => {
                            setSearch('');
                            setOpen(false);
                            Keyboard.dismiss();
                        }}
                    >
                        <Icon name="close-circle-outline" size={18} color="#666" />
                    </TouchableOpacity>
                )}
            </View>

            {/* Dropdown */}
            {open && (
                <View style={styles.dropdown}>
                    <ScrollView
                        nestedScrollEnabled
                        keyboardShouldPersistTaps="handled"
                        style={{ maxHeight: 180 }}
                    >
                        {filtered.length > 0 ? (
                            <View style={styles.dropdownChipRow}>
                                {filtered.map((item) => (
                                    <TouchableOpacity
                                        key={item}
                                        style={[styles.dropdownChip, { borderColor: chipColor }]}
                                        onPress={() => handleSelect(item)}
                                        activeOpacity={0.7}
                                    >
                                        <Text style={[styles.dropdownChipText, { color: chipColor }]}>
                                            {item}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        ) : (
                            !showAddButton && (
                                <Text style={styles.noResult}>No results</Text>
                            )
                        )}

                        {showAddButton && (
                            <TouchableOpacity
                                style={[styles.addBtn, { borderColor: chipColor }]}
                                onPress={handleAdd}
                                activeOpacity={0.75}
                            >
                                <Icon name="add-circle-outline" size={18} color={chipColor} />
                                <Text style={[styles.addBtnText, { color: chipColor }]}>
                                    Add "{search.trim()}"
                                </Text>
                            </TouchableOpacity>
                        )}
                    </ScrollView>
                </View>
            )}
        </View>
    );
};


const EditProfileScreen = () => {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();

    const initialUser = route.params?.user;

    const [loading, setLoading] = useState(false);
    const [allInterests, setAllInterests] = useState<string[]>([]);

    const [name, setName] = useState(initialUser?.profile?.name || '');
    const [gender, setGender] = useState<number>(initialUser?.profile?.gender ?? 0);
    const [date, setDate] = useState(
        initialUser?.profile?.birthday
            ? new Date(initialUser.profile.birthday)
            : new Date(),
    );
    const [selectedInterests, setSelectedInterests] = useState<string[]>(
        initialUser?.profile?.interest || [],
    );
    const [selectedTags, setSelectedTags] = useState<string[]>(
        initialUser?.profile?.personalityTags || [],
    );
    const [open, setOpen] = useState(false);

    /* Lấy Interests */
    useEffect(() => {
        const fetchInterests = async () => {
            try {
                const raw = await userService.getAllInterests();
                const data = Array.isArray(raw) ? raw : (raw?.interests ?? raw?.data ?? raw?.results ?? []);
                if (Array.isArray(data)) {
                    const names: string[] = data.map((d: any) =>
                        typeof d === 'string' ? d : (d.interest ?? d.name ?? d.title ?? d.label ?? String(d)),
                    );
                    setAllInterests(names.filter(Boolean));
                }
            } catch (e) {
                console.warn('Could not load interests from API', e);
            }
        };
        fetchInterests();
    }, []);

    const formatDate = (d: Date) =>
        `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d
            .getDate()
            .toString()
            .padStart(2, '0')}`;

    /* ── Validation ── */
    const validate = (): boolean => {
        if (name.trim().length <= 5) {
            Alert.alert('Lỗi', 'Tên phải có hơn 5 ký tự.');
            return false;
        }
        const today = new Date();
        const birthYear = date.getFullYear();
        const birthMonth = date.getMonth();
        const birthDay = date.getDate();
        let age = today.getFullYear() - birthYear;
        if (
            today.getMonth() < birthMonth ||
            (today.getMonth() === birthMonth && today.getDate() < birthDay)
        ) {
            age--;
        }
        if (age < 18) {
            Alert.alert('Lỗi', 'Bạn phải đủ 18 tuổi để sử dụng ứng dụng.');
            return false;
        }
        return true;
    };

    const handleUpdate = async () => {
        if (!validate()) return;

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

            navigation.goBack();
        } catch (error) {
            Alert.alert('Lỗi', 'Không thể cập nhật thông tin.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.root}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <Icon name="close" size={28} color="#FFF" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Edit Profile</Text>
                    <TouchableOpacity onPress={handleUpdate} disabled={loading}>
                        {loading ? (
                            <ActivityIndicator color={COLOR_PALETTE.pink} />
                        ) : (
                            <Text style={styles.saveBtnText}>Save</Text>
                        )}
                    </TouchableOpacity>
                </View>

                <ScrollView
                    contentContainerStyle={styles.container}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Full Name */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Full Name</Text>
                        <TextInput
                            style={styles.input}
                            value={name}
                            onChangeText={setName}
                            placeholder="Enter your name"
                            placeholderTextColor="#444"
                        />
                        {name.trim().length > 0 && name.trim().length <= 5 && (
                            <Text style={styles.validationHint}>Tên phải có hơn 5 ký tự</Text>
                        )}
                    </View>

                    {/* Date of Birth */}
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
                            onConfirm={(d) => {
                                setOpen(false);
                                setDate(d);
                            }}
                            onCancel={() => setOpen(false)}
                            theme="dark"
                        />
                    </View>

                    {/* Gender */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Gender</Text>
                        <View style={styles.row}>
                            {GENDER_OPTIONS.map((item) => (
                                <TouchableOpacity
                                    key={item.val}
                                    style={[
                                        styles.genderBtn,
                                        gender === item.val && styles.activeGenderBtn,
                                    ]}
                                    onPress={() => setGender(item.val)}
                                >
                                    <Text
                                        style={[
                                            styles.genderText,
                                            gender === item.val && styles.activeGenderText,
                                        ]}
                                    >
                                        {item.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* Interests — API driven */}
                    <SearchDropdown
                        label="Interests"
                        selected={selectedInterests}
                        allOptions={allInterests}
                        onSelect={(item) =>
                            setSelectedInterests((prev) =>
                                prev.includes(item) ? prev : [...prev, item],
                            )
                        }
                        onRemove={(item) =>
                            setSelectedInterests((prev) => prev.filter((i) => i !== item))
                        }
                        chipColor={COLOR_PALETTE.salmonPink}
                        allowAdd
                        placeholder="Search interests..."
                    />

                    {/* Personal Tags — hardcoded FE options + Add */}
                    <SearchDropdown
                        label="Personal Tags"
                        selected={selectedTags}
                        allOptions={AVAILABLE_PERSONALITY}
                        onSelect={(item) =>
                            setSelectedTags((prev) =>
                                prev.includes(item) ? prev : [...prev, item],
                            )
                        }
                        onRemove={(item) =>
                            setSelectedTags((prev) => prev.filter((i) => i !== item))
                        }
                        chipColor={COLOR_PALETTE.salmonPink}
                        allowAdd
                        placeholder="Search tags..."
                    />

                    <View style={{ height: 60 }} />
                </ScrollView>
            </View>
        </TouchableWithoutFeedback>
    );
};

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: '#0A0A0A' },

    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: Platform.OS === 'ios' ? 50 : 40,
        paddingBottom: 20,
        borderBottomWidth: 0.5,
        borderBottomColor: '#222',
    },
    headerTitle: { color: '#FFF', fontSize: 18, fontWeight: '700' },
    saveBtnText: { color: COLOR_PALETTE.pink, fontWeight: '700', fontSize: 16 },

    container: { padding: 20, paddingBottom: 50 },
    inputGroup: { marginBottom: 28 },
    label: {
        color: COLOR_PALETTE.pink,
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 12,
    },
    validationHint: {
        color: COLOR_PALETTE.brightPink,
        fontSize: 12,
        marginTop: 6,
    },

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

    row: { flexDirection: 'row', gap: 10 },
    genderBtn: {
        flex: 1,
        padding: 12,
        borderRadius: 10,
        backgroundColor: '#161616',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#333',
    },
    activeGenderBtn: {
        backgroundColor: 'rgba(236, 72, 153, 0.15)',
        borderColor: COLOR_PALETTE.pink,
    },
    genderText: { color: '#888', fontWeight: '600' },
    activeGenderText: { color: COLOR_PALETTE.pink },

    chipRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 12,
    },
    selectedChip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        backgroundColor: 'transparent',
        borderWidth: 1.5,
    },
    selectedChipText: {
        fontSize: 13,
        fontWeight: '600',
    },

    searchBarWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#161616',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#333',
        paddingHorizontal: 14,
        paddingVertical: 10,
    },
    searchInput: {
        flex: 1,
        color: '#FFF',
        fontSize: 15,
        padding: 0,
    },

    dropdown: {
        marginTop: 6,
        backgroundColor: '#1A1A1A',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#2A2A2A',
        overflow: 'hidden',
    },
    dropdownChipRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        padding: 12,
    },
    dropdownChip: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        backgroundColor: 'transparent',
        borderWidth: 1.5,
    },
    dropdownChipText: {
        fontSize: 13,
        fontWeight: '600',
    },
    noResult: {
        color: '#555',
        fontSize: 13,
        padding: 14,
        textAlign: 'center',
    },
    addBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 14,
        paddingVertical: 12,
        borderTopWidth: 1,
        borderTopColor: '#2A2A2A',
    },
    addBtnText: {
        fontSize: 14,
        fontWeight: '600',
    },
});

export default EditProfileScreen;