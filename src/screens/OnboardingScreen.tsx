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
  Image,
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
import AsyncStorage from '@react-native-async-storage/async-storage';

AsyncStorage.clear();

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const SW = SCREEN_WIDTH;
const SCENE_HEIGHT = Math.max(SCREEN_HEIGHT, 820);
const PANEL_WIDTH = Math.min(SCREEN_WIDTH - 56, 500);
const PANEL_HEIGHT = Math.min(Math.max(SCENE_HEIGHT * 0.5, 320), 640);

const assets = {
  title: require('../assets/title.webp'),
  light: require('../assets/light.webp'),
  cloud: require('../assets/cloud.webp'),
  letter: require('../assets/letter.webp'),
  butterfly: require('../assets/butterfly_light.webp'),
  openButton: require('../assets/button.webp'),
};

const GENDERS = [
  { label: 'Male', value: 1, icon: 'male-outline' },
  { label: 'Female', value: 2, icon: 'female-outline' },
  { label: 'Other', value: 3, icon: 'male-female-outline' },
];

const PREDEFINED_INTERESTS = [
  'Music',
  'Travel',
  'Food',
  'Sports',
  'Art',
  'Reading',
  'Gaming',
  'Photography',
];

const PREDEFINED_PERSONALITIES = [
  'Outgoing',
  'Creative',
  'Introvert',
  'Energetic',
  'Romantic',
  'Chill',
  'Ambitious',
  'Funny',
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
    outputRange: ['0%', '100%'],
  });
  return (
    <View style={styles.progressTrack}>
      <Animated.View style={[styles.progressFill, { width }]} />
    </View>
  );
};

const OnboardingScreen = () => {
  const { setIsOnboarded, setActiveTab, setLogout } = useAppStore();

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
    if (step === 0 && !name.trim())
      return Alert.alert('Notice', 'Please enter your name.');
    if (step === 1 && (!birthday.trim() || gender === null))
      return Alert.alert('Notice', 'Please select your birthday and gender.');
    if (step === 2 && !location.trim())
      return Alert.alert('Notice', 'Please enter your location.');

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

  const handleBackToLogin = async () => {
    await setLogout();
  };

  const submitProfile = async () => {
    setLoading(true);
    try {
      const parts = birthday.split('/');
      let isoDate = '2000-01-01T00:00:00Z';
      if (parts.length === 3)
        isoDate = `${parts[2]}-${parts[1]}-${parts[0]}T00:00:00Z`;

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
      Alert.alert('Error', error.message || 'Unable to update your profile.');
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
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#020001" />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        scrollEnabled={false}
        bounces={false}
      >
        <LinearGradient
          colors={['#000000', '#030002', '#110511', '#1f071d']}
          locations={[0, 0.45, 0.78, 1]}
          style={StyleSheet.absoluteFillObject}
        />

        <Image
          source={assets.cloud}
          style={styles.cloud}
          resizeMode="contain"
        />
        <Image
          source={assets.letter}
          style={styles.letter}
          resizeMode="contain"
        />
        <Image
          source={assets.butterfly}
          style={styles.butterfly}
          resizeMode="contain"
        />

        <View style={styles.scene}>
          <Image
            source={assets.title}
            style={styles.logo}
            resizeMode="contain"
          />

          <Image
            source={assets.light}
            style={styles.lantern}
            resizeMode="contain"
          />

          <View style={styles.panel}>
            <View style={styles.panelContent}>
              <View style={styles.panelHeader}>
                {step > 0 ? (
                  <TouchableOpacity
                    style={styles.backBtn}
                    onPress={handleBack}
                    activeOpacity={0.75}
                  >
                    <Icon
                      name="arrow-back"
                      size={22}
                      color="rgba(255,221,233,0.72)"
                    />
                  </TouchableOpacity>
                ) : (
                  <View style={styles.backBtnPlaceholder} />
                )}

                <View style={styles.panelTitleBlock}>
                  <Text style={styles.formTitle}>Love Profile</Text>
                  <Text style={styles.stepText}>Step {step + 1} / 4</Text>
                </View>

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
                style={styles.pager}
              >
                <View style={styles.slide}>
                  <ScrollView
                    showsVerticalScrollIndicator={false}
                    nestedScrollEnabled
                    bounces={false}
                    contentContainerStyle={styles.slideInner}
                  >
                    {renderHeader(
                      'What is your name?',
                      'This name will appear on your profile.',
                    )}
                    <PinkInput
                      label="DISPLAY NAME"
                      placeholder="Enter your name"
                      value={name}
                      onChangeText={setName}
                    />
                  </ScrollView>
                </View>

                <View style={styles.slide}>
                  <ScrollView
                    showsVerticalScrollIndicator={false}
                    nestedScrollEnabled
                    bounces={false}
                    contentContainerStyle={styles.slideInner}
                  >
                    {renderHeader(
                      'Basic Information',
                      'Choose your birthday and gender.',
                    )}
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() => {
                        Keyboard.dismiss();
                        setShowDatePicker(true);
                      }}
                    >
                      <View pointerEvents="none">
                        <PinkInput
                          label="DATE OF BIRTH"
                          placeholder="DD/MM/YYYY"
                          value={birthday}
                          onChangeText={() => {}}
                          keyboardType="numeric"
                          maxLength={10}
                          editable={false}
                        />
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

                    <Text style={styles.sectionLabel}>YOUR GENDER</Text>
                    <View style={styles.genderContainer}>
                      {GENDERS.map(g => {
                        const isActive = gender === g.value;
                        return (
                          <TouchableOpacity
                            key={g.value}
                            style={[
                              styles.genderBox,
                              isActive && styles.genderBoxActive,
                            ]}
                            onPress={() => setGender(g.value)}
                            activeOpacity={0.8}
                          >
                            {isActive && (
                              <LinearGradient
                                colors={[
                                  'rgba(255,194,209,0.15)',
                                  'rgba(255,194,209,0.02)',
                                ]}
                                style={[
                                  StyleSheet.absoluteFill,
                                  { borderRadius: 12 },
                                ]}
                              />
                            )}
                            <Icon
                              name={g.icon}
                              size={25}
                              color={
                                isActive
                                  ? COLOR_PALETTE.pink
                                  : 'rgba(255,194,209,0.34)'
                              }
                              style={{ marginBottom: 6 }}
                            />
                            <Text
                              style={[
                                styles.genderText,
                                isActive && styles.genderTextActive,
                              ]}
                            >
                              {g.label}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </ScrollView>
                </View>

                <View style={styles.slide}>
                  <ScrollView
                    showsVerticalScrollIndicator={false}
                    nestedScrollEnabled
                    bounces={false}
                    contentContainerStyle={styles.slideInner}
                  >
                    {renderHeader(
                      'Where are you from?',
                      'Share your area to make better matches.',
                    )}
                    <PinkInput
                      label="LOCATION"
                      placeholder="e.g. Hanoi, Vietnam"
                      value={location}
                      onChangeText={setLocation}
                    />
                  </ScrollView>
                </View>

                <View style={styles.slide}>
                  <ScrollView
                    showsVerticalScrollIndicator={false}
                    nestedScrollEnabled
                    bounces={false}
                    contentContainerStyle={styles.tagsContent}
                  >
                    {renderHeader(
                      'Interests & Personality',
                      'Help others understand you better.',
                    )}
                    <Text style={styles.tagsLabel}>INTERESTS</Text>
                    <View style={styles.chipContainer}>
                      {[...PREDEFINED_INTERESTS, ...customInterests].map(
                        item => {
                          const isActive = interests.includes(item);
                          return (
                            <TouchableOpacity
                              key={item}
                              style={[styles.chip, isActive && styles.chipActive]}
                              onPress={() =>
                                setInterests(
                                  isActive
                                    ? interests.filter(i => i !== item)
                                    : [...interests, item],
                                )
                              }
                            >
                              <Text
                                style={[
                                  styles.chipText,
                                  isActive && styles.chipTextActive,
                                ]}
                              >
                                {item}
                              </Text>
                            </TouchableOpacity>
                          );
                        },
                      )}

                      <TouchableOpacity
                        style={styles.chipAdd}
                        onPress={() => setShowInterestInput(true)}
                      >
                        <Icon
                          name="add"
                          size={16}
                          color="rgba(255,194,209,0.5)"
                        />
                        <Text style={styles.chipAddText}>Other</Text>
                      </TouchableOpacity>
                    </View>

                    {showInterestInput && (
                      <View style={styles.customAddRow}>
                        <TextInput
                          style={styles.customAddInput}
                          placeholder="Enter another interest..."
                          placeholderTextColor="rgba(255,194,209,0.3)"
                          value={newInterest}
                          onChangeText={setNewInterest}
                          autoFocus
                        />
                        <TouchableOpacity
                          style={styles.customAddBtn}
                          onPress={() => {
                            const val = newInterest.trim();
                            if (
                              val &&
                              !PREDEFINED_INTERESTS.includes(val) &&
                              !customInterests.includes(val)
                            ) {
                              setCustomInterests([...customInterests, val]);
                              setInterests([...interests, val]);
                            }
                            setNewInterest('');
                            setShowInterestInput(false);
                          }}
                        >
                          <Text style={styles.customAddBtnText}>Add</Text>
                        </TouchableOpacity>
                      </View>
                    )}

                    <Text style={[styles.tagsLabel, styles.personalityLabel]}>
                      PERSONALITY
                    </Text>
                    <View style={styles.chipContainer}>
                      {[...PREDEFINED_PERSONALITIES, ...customPersonalities].map(
                        item => {
                          const isActive = personalities.includes(item);
                          return (
                            <TouchableOpacity
                              key={item}
                              style={[styles.chip, isActive && styles.chipActive]}
                              onPress={() =>
                                setPersonalities(
                                  isActive
                                    ? personalities.filter(p => p !== item)
                                    : [...personalities, item],
                                )
                              }
                            >
                              <Text
                                style={[
                                  styles.chipText,
                                  isActive && styles.chipTextActive,
                                ]}
                              >
                                {item}
                              </Text>
                            </TouchableOpacity>
                          );
                        },
                      )}

                      <TouchableOpacity
                        style={styles.chipAdd}
                        onPress={() => setShowPersonalityInput(true)}
                      >
                        <Icon
                          name="add"
                          size={16}
                          color="rgba(255,194,209,0.5)"
                        />
                        <Text style={styles.chipAddText}>Other</Text>
                      </TouchableOpacity>
                    </View>

                    {showPersonalityInput && (
                      <View style={styles.customAddRow}>
                        <TextInput
                          style={styles.customAddInput}
                          placeholder="Enter another personality..."
                          placeholderTextColor="rgba(255,194,209,0.3)"
                          value={newPersonality}
                          onChangeText={setNewPersonality}
                          autoFocus
                        />
                        <TouchableOpacity
                          style={styles.customAddBtn}
                          onPress={() => {
                            const val = newPersonality.trim();
                            if (
                              val &&
                              !PREDEFINED_PERSONALITIES.includes(val) &&
                              !customPersonalities.includes(val)
                            ) {
                              setCustomPersonalities([
                                ...customPersonalities,
                                val,
                              ]);
                              setPersonalities([...personalities, val]);
                            }
                            setNewPersonality('');
                            setShowPersonalityInput(false);
                          }}
                        >
                          <Text style={styles.customAddBtnText}>Add</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </ScrollView>
                </View>
              </ScrollView>

              <TouchableOpacity
                style={[styles.openButtonFrame, loading && styles.disabledButton]}
                onPress={handleNext}
                disabled={loading}
                activeOpacity={0.88}
              >
                <View pointerEvents="none" style={styles.openButtonImageLayer}>
                  <Image
                    source={assets.openButton}
                    style={styles.openButtonAsset}
                    resizeMode="contain"
                  />
                </View>
                {loading ? (
                  <ActivityIndicator
                    color="#ffe8f1"
                    style={styles.openButtonContent}
                  />
                ) : (
                  <Text style={[styles.openButtonText, styles.openButtonContent]}>
                    Continue
                  </Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleBackToLogin}
                activeOpacity={0.75}
                style={styles.loginLinkBelow}
              >
                <Text style={styles.linkText}>Back to Login</Text>
              </TouchableOpacity>
            </View>
          </View>
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
    </View>
  );
};

export default OnboardingScreen;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#020001',
    overflow: 'hidden',
  },
  scroll: {
    minHeight: SCENE_HEIGHT,
    overflow: 'hidden',
  },
  scene: {
    minHeight: SCENE_HEIGHT,
    alignItems: 'center',
    paddingTop: Math.max(48, SCENE_HEIGHT * 0.06),
    paddingBottom: 240,
  },
  logo: {
    width: Math.min(SCREEN_WIDTH * 0.58, 330),
    height: Math.min(SCREEN_WIDTH * 0.4, 145),
    zIndex: 5,
    transform: [{ scale: 1.7 }],
  },
  lantern: {
    position: 'absolute',
    top: Math.max(142, SCENE_HEIGHT * 0.15),
    right: Math.max(20, SCREEN_WIDTH * 0.12),
    width: Math.min(SCREEN_WIDTH * 0.2, 118),
    height: Math.min(SCREEN_WIDTH * 0.32, 178),
    zIndex: 7,
    transform: [{ scale: 2 }],
    filter: 'drop-shadow(0px 0px 20px rgba(255, 155, 215, 1))',
  },
  panel: {
    width: PANEL_WIDTH,
    height: PANEL_HEIGHT,
    marginTop: Math.max(22, SCENE_HEIGHT * 0.035),
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(255,212,228,0.38)',
    backgroundColor: 'rgba(2,0,2,0.82)',
    shadowColor: '#f9a2cb',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.28,
    shadowRadius: 14,
    elevation: 10,
    justifyContent: 'center',
    zIndex: 4,
  },
  panelContent: {
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: 36,
    paddingBottom: 24,
    justifyContent: 'flex-start',
  },
  panelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  panelTitleBlock: {
    flex: 1,
    alignItems: 'center',
  },
  formTitle: {
    fontSize: 27,
    fontFamily: 'serif',
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#e8c5ce',
    textShadowColor: '#c12a7f',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 9,
  },
  stepText: {
    marginTop: 4,
    color: 'rgba(255,221,233,0.58)',
    fontSize: 14,
    fontFamily: 'serif',
    fontWeight: 'bold',
  },
  backBtn: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtnPlaceholder: {
    width: 34,
    height: 34,
  },
  progressTrack: {
    height: 3,
    backgroundColor: 'rgba(255,194,209,0.14)',
    borderRadius: 1.5,
    overflow: 'hidden',
    marginBottom: 16,
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLOR_PALETTE.pink,
    borderRadius: 1.5,
    ...({ boxShadow: '0px 0px 8px 0px #ffc2d1' } as ViewStyle),
  },
  pager: {
    flex: 1,
    marginHorizontal: -28,
    minHeight: 0,
  },
  slide: {
    width: SW,
    flex: 1,
  },
  slideInner: {
    width: PANEL_WIDTH,
    paddingHorizontal: 28,
    paddingTop: 10,
    paddingBottom: 28,
  },
  tagsContent: {
    width: PANEL_WIDTH,
    paddingHorizontal: 28,
    paddingTop: 10,
    paddingBottom: 28,
  },
  stepHeader: {
    marginBottom: 22,
  },
  title: {
    fontSize: 23,
    fontFamily: 'serif',
    fontWeight: 'bold',
    color: '#e8c5ce',
    textAlign: 'center',
    textShadowColor: '#c12a7f',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 9,
  },
  subtitle: {
    marginTop: 8,
    fontSize: 13,
    color: 'rgba(255,221,233,0.52)',
    lineHeight: 18,
    fontFamily: 'serif',
    textAlign: 'center',
  },
  fieldGroup: {
    marginBottom: 18,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.1,
    marginBottom: 8,
    fontFamily: 'serif',
  },
  fieldInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    paddingBottom: 10,
  },
  fieldInput: {
    flex: 1,
    color: '#ffe8f1',
    fontSize: 17,
    fontWeight: '500',
    padding: 0,
    fontFamily: 'serif',
    textShadowColor: 'rgba(255,157,205,0.35)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  sectionLabel: {
    color: 'rgba(255,221,233,0.5)',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.1,
    marginTop: 2,
    marginBottom: 12,
    fontFamily: 'serif',
  },
  genderContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  genderBox: {
    flex: 1,
    height: 88,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,213,229,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.18)',
    overflow: 'hidden',
  },
  genderBoxActive: {
    borderColor: COLOR_PALETTE.pink,
    ...({
      boxShadow: 'inset 0px 0px 12px 0px rgba(255,194,209,0.2)',
    } as ViewStyle),
  },
  genderText: {
    fontSize: 13,
    color: 'rgba(255,221,233,0.46)',
    fontWeight: '700',
    fontFamily: 'serif',
  },
  genderTextActive: {
    color: COLOR_PALETTE.pink,
  },
  tagsLabel: {
    color: 'rgba(255,221,233,0.5)',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.1,
    marginBottom: 12,
    fontFamily: 'serif',
  },
  personalityLabel: {
    marginTop: 24,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 9,
  },
  chip: {
    paddingHorizontal: 15,
    paddingVertical: 9,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,213,229,0.22)',
    backgroundColor: 'rgba(255,194,209,0.03)',
  },
  chipActive: {
    borderColor: COLOR_PALETTE.pink,
    backgroundColor: 'rgba(255,194,209,0.15)',
    ...({ boxShadow: '0px 0px 8px 0px rgba(255,194,209,0.2)' } as ViewStyle),
  },
  chipText: {
    fontSize: 13,
    color: 'rgba(255,221,233,0.54)',
    fontWeight: '600',
    fontFamily: 'serif',
  },
  chipTextActive: {
    color: COLOR_PALETTE.pink,
    fontWeight: '800',
  },
  chipAdd: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 18,
    borderWidth: 1.3,
    borderColor: 'rgba(255,213,229,0.26)',
    borderStyle: 'dashed',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  chipAddText: {
    fontSize: 13,
    color: 'rgba(255,221,233,0.54)',
    fontWeight: '600',
    fontFamily: 'serif',
  },
  customAddRow: {
    flexDirection: 'row',
    marginTop: 14,
    alignItems: 'center',
    gap: 10,
  },
  customAddInput: {
    flex: 1,
    height: 42,
    backgroundColor: 'rgba(255,194,209,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,194,209,0.2)',
    borderRadius: 21,
    paddingHorizontal: 14,
    color: '#ffe8f1',
    fontSize: 14,
    fontFamily: 'serif',
  },
  customAddBtn: {
    height: 42,
    paddingHorizontal: 18,
    borderRadius: 21,
    backgroundColor: COLOR_PALETTE.pink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  customAddBtnText: {
    color: '#17050A',
    fontWeight: '700',
    fontSize: 14,
    fontFamily: 'serif',
  },
  openButtonFrame: {
    width: Math.min(SCREEN_WIDTH * 0.58, 342),
    height: Math.min(SCREEN_WIDTH * 0.16, 96),
    marginTop: 14,
    alignSelf: 'center',
    zIndex: 8,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
  },
  openButtonImageLayer: {
    width: '100%',
    height: '100%',
    zIndex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  openButtonContent: {
    position: 'absolute',
    zIndex: 2,
  },
  openButtonText: {
    color: '#934564',
    fontSize: 18,
    fontFamily: 'serif',
    fontWeight: 'bold',
    textAlign: 'center',
    transform: [{ translateY: -10 }],
  },
  disabledButton: {
    opacity: 0.75,
  },
  openButtonAsset: {
    width: '100%',
    height: '100%',
    zIndex: 1,
    transform: [{ scale: 1.5 }, { translateY: -6 }],
  },
  loginLinkBelow: {
    marginTop: 2,
    zIndex: 10,
    elevation: 10,
    minHeight: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  linkText: {
    color: 'rgba(255,221,233,0.66)',
    fontSize: 14,
    fontFamily: 'serif',
    fontWeight: 'bold',
  },
  cloud: {
    position: 'absolute',
    left: -10,
    bottom: -24,
    width: Math.min(SCREEN_WIDTH * 0.82, 520),
    height: 220,
    opacity: 0.4,
    zIndex: 1,
    transform: [{ scale: 2.5 }, { rotate: '-10deg' }],
  },
  letter: {
    position: 'absolute',
    left: 10,
    bottom: 40,
    width: Math.min(SCREEN_WIDTH * 0.62, 390),
    height: Math.min(SCREEN_WIDTH * 0.34, 220),
    zIndex: 2,
    transform: [{ scale: 1.8 }],
  },
  butterfly: {
    position: 'absolute',
    right: Math.max(24, SCREEN_WIDTH * 0.1),
    bottom: Math.max(158, SCENE_HEIGHT * 0.18),
    width: Math.min(SCREEN_WIDTH * 0.12, 70),
    height: Math.min(SCREEN_WIDTH * 0.12, 70),
    zIndex: 3,
    transform: [{ scaleX: -1 }],
    filter: 'drop-shadow(0px 0px 20px rgba(255, 155, 215, 1))',
  },
});
