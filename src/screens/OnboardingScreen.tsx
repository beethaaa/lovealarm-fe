/* eslint-disable react-native/no-inline-styles */
/* eslint-disable react-hooks/exhaustive-deps */
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
  Dimensions,
  ScrollView,
  ViewStyle,
  Keyboard,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import COLOR_PALETTE from '../styles/colorPalette';
import { userService } from '../services/userService';
import { useAppStore } from '../store/appStore';
import LinearGradient from 'react-native-linear-gradient';
import DateTimePicker from '@react-native-community/datetimepicker';

const { width: SW } = Dimensions.get('window');

const GENDERS = [
  { label: 'Nam', value: 1, icon: 'male-outline' },
  { label: 'Nữ', value: 2, icon: 'female-outline' },
  { label: 'Khác', value: 3, icon: 'male-female-outline' },
];

const PREDEFINED_INTERESTS = [
  'Music', 'Travel', 'Food', 'Sports',
  'Art', 'Reading', 'Gaming', 'Photography',
];

const PREDEFINED_PERSONALITIES = [
  'Outgoing', 'Creative', 'Introvert', 'Energetic',
  'Romantic', 'Chill', 'Ambitious', 'Funny',
];

const PinkInput = ({
  label,
  placeholder,
  value,
  onChangeText,
  keyboardType = 'default',
  maxLength,
  editable = true,
}: any) => {
  const [focused, setFocused] = useState(false);
  const anim = useRef(new Animated.Value(value ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: focused || value ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [focused, value]);

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
      <Animated.Text style={[styles.fieldLabel, { color: labelColor }]}>
        {label}
      </Animated.Text>
      <Animated.View
        style={[
          styles.fieldInputRow,
          { borderColor },
          focused && ({ boxShadow: 'inset 0px -1px 8px 0px rgba(255,194,209,0.08)' } as ViewStyle)
        ]}
      >
        <TextInput
          placeholder={placeholder}
          placeholderTextColor="rgba(255,194,209,0.2)"
          style={styles.fieldInput}
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboardType}
          maxLength={maxLength}
          editable={editable}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
      </Animated.View>
    </View>
  );
};

const ProgressBar = ({ step, total }: { step: number; total: number }) => {
  const progress = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(progress, {
      toValue: (step + 1) / total,
      tension: 60,
      friction: 8,
      useNativeDriver: false,
    }).start();
  }, [step]);
  const width = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%']
  });
  return (
    <View style={styles.progressTrack}>
      <Animated.View style={[styles.progressFill, { width }]} />
    </View>
  );
};

const OnboardingScreen = () => {
  const { setIsOnboarded, setActiveTab } = useAppStore();
  
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  const [name, setName] = useState('');
  const [birthday, setBirthday] = useState('');
  const [gender, setGender] = useState<number | null>(null);
  const [location, setLocation] = useState('');
  const [interests, setInterests] = useState<string[]>([]);
  const [personalities, setPersonalities] = useState<string[]>([]);
  
  const [customInterests, setCustomInterests] = useState<string[]>([]);
  const [customPersonalities, setCustomPersonalities] = useState<string[]>([]);
  const [showInterestInput, setShowInterestInput] = useState(false);
  const [showPersonalityInput, setShowPersonalityInput] = useState(false);
  const [newInterest, setNewInterest] = useState('');
  const [newPersonality, setNewPersonality] = useState('');

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [birthdayDate, setBirthdayDate] = useState(new Date(2000, 0, 1));

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if ((event.type === 'set' || Platform.OS === 'ios') && selectedDate) {
      setBirthdayDate(selectedDate);
      const day = selectedDate.getDate().toString().padStart(2, '0');
      const month = (selectedDate.getMonth() + 1).toString().padStart(2, '0');
      const year = selectedDate.getFullYear();
      setBirthday(`${day}/${month}/${year}`);
    }
  };

  const handleNext = () => {
    if (step === 0 && !name.trim()) return Alert.alert('Thông báo', 'Vui lòng cho biết tên của bạn!');
    if (step === 1 && (!birthday.trim() || gender === null)) return Alert.alert('Thông báo', 'Vui lòng điền ngày sinh và giới tính!');
    if (step === 2 && !location.trim()) return Alert.alert('Thông báo', 'Vui lòng cho biết bạn đến từ đâu!');

    if (step < 3) {
      setStep(step + 1);
      scrollViewRef.current?.scrollTo({ x: (step + 1) * SW, animated: true });
    } else {
      submitProfile();
    }
  };

  const handleBack = () => {
    if (step > 0) {
      setStep(step - 1);
      scrollViewRef.current?.scrollTo({ x: (step - 1) * SW, animated: true });
    }
  };

  const submitProfile = async () => {
    setLoading(true);
    try {
      const parts = birthday.split('/');
      let isoDate = '2000-01-01T00:00:00Z';
      if (parts.length === 3) isoDate = `${parts[2]}-${parts[1]}-${parts[0]}T00:00:00Z`;

      const payload = {
        profile: {
          name,
          gender: gender || 1,
          birthday: isoDate,
          location,
          interest: [...interests],
          personalityTags: [...personalities],
        },
      };

      await userService.updateUser(payload);
      setActiveTab('home');
      setIsOnboarded(true);
    } catch (error: any) {
      Alert.alert('Lỗi', error.message || 'Không thể cập nhật hồ sơ.');
    } finally {
      setLoading(false);
    }
  };

  const renderHeader = (title: string, subtitle: string) => (
    <View style={styles.stepHeader}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </View>
  );

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#0A0A0A" />

      <View style={styles.headerRow}>
        {step > 0 ? (
          <TouchableOpacity style={styles.backBtn} onPress={handleBack}>
            <Icon name="arrow-back" size={20} color={COLOR_PALETTE.pink} />
          </TouchableOpacity>
        ) : <View style={styles.backBtnPlaceholder} />}
        <Text style={styles.brandTitle}>LOVE ALARM</Text>
        <View style={styles.backBtnPlaceholder} />
      </View>

      <ProgressBar step={step} total={4} />

      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEnabled={false}
        keyboardShouldPersistTaps="handled" 
        style={{ flex: 1 }}
      >
        <View style={styles.slide}>
          {renderHeader('Bạn tên là gì?', 'Tên này sẽ hiển thị trên hồ sơ của bạn và gợi ý cho mọi người.')}
          <PinkInput label="TÊN HIỂN THỊ" placeholder="Nhập tên của bạn" value={name} onChangeText={setName} />
        </View>

        <View style={styles.slide}>
          {renderHeader('Thông tin cơ bản', 'Chọn ngày sinh và giới tính để nhận được những gợi ý chuẩn xác nhất.')}
          <TouchableOpacity activeOpacity={0.8} onPress={() => {
            Keyboard.dismiss();
            setShowDatePicker(true);
          }}>
            <View pointerEvents="none">
              <PinkInput label="NGÀY SINH" placeholder="DD/MM/YYYY" value={birthday} onChangeText={() => {}} keyboardType="numeric" maxLength={10} editable={false} />
            </View>
          </TouchableOpacity>
          {Platform.OS === 'ios' && showDatePicker && (
            <DateTimePicker
              value={birthdayDate}
              mode="date"
              display="spinner"
              onChange={handleDateChange}
              maximumDate={new Date()}
            />
          )}

          <Text style={[styles.fieldLabel, { color: 'rgba(255,194,209,0.4)', marginTop: 24, marginBottom: 12 }]}>GIỚI TÍNH CỦA BẠN</Text>
          <View style={styles.genderContainer}>
            {GENDERS.map(g => {
              const isActive = gender === g.value;
              return (
                <TouchableOpacity key={g.value} style={[styles.genderBox, isActive && styles.genderBoxActive]} onPress={() => setGender(g.value)} activeOpacity={0.8}>
                   {isActive && <LinearGradient colors={['rgba(255,194,209,0.15)', 'rgba(255,194,209,0.02)']} style={[StyleSheet.absoluteFill, { borderRadius: 16 }]} />}
                   <Icon name={g.icon} size={28} color={isActive ? COLOR_PALETTE.pink : 'rgba(255,194,209,0.3)'} style={{ marginBottom: 8 }} />
                   <Text style={[styles.genderText, isActive && styles.genderTextActive]}>{g.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.slide}>
          {renderHeader('Bạn đến từ đâu?', 'Chia sẻ khu vực để bắt sóng với những người xung quanh bạn dễ dàng hơn.')}
          <PinkInput label="VỊ TRÍ / ĐỊA ĐIỂM" placeholder="VD: Hà Nội, Việt Nam" value={location} onChangeText={setLocation} />
        </View>

        <View style={styles.slide}>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 60 }}>
            {renderHeader('Sở thích & Tính cách', 'Hãy để mọi người hiểu thêm về con người thật của bạn.')}
            <Text style={[styles.fieldLabel, { color: 'rgba(255,194,209,0.4)', marginBottom: 16 }]}>SỞ THÍCH</Text>
            <View style={styles.chipContainer}>
              {[...PREDEFINED_INTERESTS, ...customInterests].map(item => {
                const isActive = interests.includes(item);
                return (
                  <TouchableOpacity key={item} style={[styles.chip, isActive && styles.chipActive]}
                    onPress={() => setInterests(isActive ? interests.filter(i => i !== item) : [...interests, item])}>
                    <Text style={[styles.chipText, isActive && styles.chipTextActive]}>{item}</Text>
                  </TouchableOpacity>
                );
              })}
              
              <TouchableOpacity style={styles.chipAdd} onPress={() => setShowInterestInput(true)}>
                <Icon name="add" size={16} color="rgba(255,194,209,0.5)" />
                <Text style={styles.chipAddText}>Khác</Text>
              </TouchableOpacity>
            </View>

            {showInterestInput && (
              <View style={styles.customAddRow}>
                <TextInput
                  style={styles.customAddInput}
                  placeholder="Nhập sở thích khác..."
                  placeholderTextColor="rgba(255,194,209,0.3)"
                  value={newInterest}
                  onChangeText={setNewInterest}
                  autoFocus
                />
                <TouchableOpacity
                  style={styles.customAddBtn}
                  onPress={() => {
                    const val = newInterest.trim();
                    if (val && !PREDEFINED_INTERESTS.includes(val) && !customInterests.includes(val)) {
                      setCustomInterests([...customInterests, val]);
                      setInterests([...interests, val]);
                    }
                    setNewInterest('');
                    setShowInterestInput(false);
                  }}
                >
                  <Text style={styles.customAddBtnText}>Thêm</Text>
                </TouchableOpacity>
              </View>
            )}

            <Text style={[styles.fieldLabel, { color: 'rgba(255,194,209,0.4)', marginTop: 32, marginBottom: 16 }]}>TÍNH CÁCH</Text>
            <View style={styles.chipContainer}>
              {[...PREDEFINED_PERSONALITIES, ...customPersonalities].map(item => {
                const isActive = personalities.includes(item);
                return (
                  <TouchableOpacity key={item} style={[styles.chip, isActive && styles.chipActive]}
                    onPress={() => setPersonalities(isActive ? personalities.filter(p => p !== item) : [...personalities, item])}>
                    <Text style={[styles.chipText, isActive && styles.chipTextActive]}>{item}</Text>
                  </TouchableOpacity>
                );
              })}
              
              <TouchableOpacity style={styles.chipAdd} onPress={() => setShowPersonalityInput(true)}>
                <Icon name="add" size={16} color="rgba(255,194,209,0.5)" />
                <Text style={styles.chipAddText}>Khác</Text>
              </TouchableOpacity>
            </View>

            {showPersonalityInput && (
              <View style={styles.customAddRow}>
                <TextInput
                  style={styles.customAddInput}
                  placeholder="Nhập tính cách khác..."
                  placeholderTextColor="rgba(255,194,209,0.3)"
                  value={newPersonality}
                  onChangeText={setNewPersonality}
                  autoFocus
                />
                <TouchableOpacity
                  style={styles.customAddBtn}
                  onPress={() => {
                    const val = newPersonality.trim();
                    if (val && !PREDEFINED_PERSONALITIES.includes(val) && !customPersonalities.includes(val)) {
                      setCustomPersonalities([...customPersonalities, val]);
                      setPersonalities([...personalities, val]);
                    }
                    setNewPersonality('');
                    setShowPersonalityInput(false);
                  }}
                >
                  <Text style={styles.customAddBtnText}>Thêm</Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </View>
      </ScrollView>

      {Platform.OS === 'android' && showDatePicker && (
        <DateTimePicker
          value={birthdayDate}
          mode="date"
          display="spinner"
          onChange={handleDateChange}
          maximumDate={new Date()}
        />
      )}

      <View style={styles.footer}>
        <TouchableOpacity style={[styles.mainBtn, loading && { opacity: 0.6 }]} onPress={handleNext} disabled={loading} activeOpacity={0.85}>
          {loading ? <ActivityIndicator color={COLOR_PALETTE.pink} /> : (
            <>
              <Text style={styles.mainBtnText}>{step === 3 ? 'Bắt đầu ngay' : 'Tiếp theo'}</Text>
              {step < 3 && <Icon name="arrow-forward" size={18} color={COLOR_PALETTE.pink} style={{ marginLeft: 8 }} />}
            </>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

export default OnboardingScreen;

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0A0A0A' },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 60 : 32,
    paddingBottom: 24,
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
  backBtnPlaceholder: { width: 40, height: 40 },
  brandTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: COLOR_PALETTE.pink,
    letterSpacing: 4,
  },
  progressTrack: {
    height: 3,
    backgroundColor: 'rgba(255,194,209,0.1)',
    marginHorizontal: 24,
    borderRadius: 1.5,
    overflow: 'hidden',
    marginBottom: 24,
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLOR_PALETTE.pink,
    borderRadius: 1.5,
    ...({ boxShadow: '0px 0px 8px 0px #ffc2d1' } as ViewStyle),
  },
  slide: { width: SW, paddingHorizontal: 24, flex: 1 },
  stepHeader: { marginBottom: 40, marginTop: 12 },
  title: {
    fontSize: 32,
    fontWeight: '900',
    color: COLOR_PALETTE.pink,
    letterSpacing: 0.5,
    marginBottom: 12,
    textShadowColor: COLOR_PALETTE.brightPink,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 15,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,194,209,0.5)',
    lineHeight: 22,
    fontWeight: '500',
  },
  fieldGroup: { marginBottom: 24 },
  fieldLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 10,
  },
  fieldInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1.5,
    paddingBottom: 14,
  },
  fieldInput: {
    flex: 1,
    color: COLOR_PALETTE.lavenderBlush,
    fontSize: 18,
    fontWeight: '600',
    padding: 0,
  },
  genderContainer: { flexDirection: 'row', gap: 12 },
  genderBox: {
    flex: 1,
    height: 110,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(255,194,209,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0A0A0A',
  },
  genderBoxActive: {
    borderColor: COLOR_PALETTE.pink,
    ...({ boxShadow: 'inset 0px 0px 12px 0px rgba(255,194,209,0.2)' } as ViewStyle),
  },
  genderText: {
    fontSize: 14,
    color: 'rgba(255,194,209,0.4)',
    fontWeight: '700',
  },
  genderTextActive: {
    color: COLOR_PALETTE.pink,
  },
  chipContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  chip: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,194,209,0.15)',
    backgroundColor: 'rgba(255,194,209,0.03)',
  },
  chipActive: {
    borderColor: COLOR_PALETTE.pink,
    backgroundColor: 'rgba(255,194,209,0.15)',
    ...({ boxShadow: '0px 0px 8px 0px rgba(255,194,209,0.2)' } as ViewStyle),
  },
  chipText: {
    fontSize: 13,
    color: 'rgba(255,194,209,0.5)',
    fontWeight: '600',
  },
  chipTextActive: {
    color: COLOR_PALETTE.pink,
    fontWeight: '800',
  },
  chipAdd: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: 'rgba(255,194,209,0.2)',
    borderStyle: 'dashed',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  chipAddText: {
    fontSize: 13,
    color: 'rgba(255,194,209,0.5)',
    fontWeight: '600',
  },
  customAddRow: {
    flexDirection: 'row',
    marginTop: 16,
    alignItems: 'center',
    gap: 12,
  },
  customAddInput: {
    flex: 1,
    height: 44,
    backgroundColor: 'rgba(255,194,209,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,194,209,0.2)',
    borderRadius: 22,
    paddingHorizontal: 16,
    color: COLOR_PALETTE.pink,
    fontSize: 14,
  },
  customAddBtn: {
    height: 44,
    paddingHorizontal: 20,
    borderRadius: 22,
    backgroundColor: COLOR_PALETTE.pink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  customAddBtnText: {
    color: '#0A0A0A',
    fontWeight: '700',
    fontSize: 14,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    paddingTop: 16,
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
    ...({ boxShadow: 'inset 0px -2px 16px 0px #ffc2d1' } as ViewStyle),
  },
  mainBtnText: {
    color: COLOR_PALETTE.pink,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
