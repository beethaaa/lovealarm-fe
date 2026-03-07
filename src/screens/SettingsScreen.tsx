import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  StyleSheet,
  Switch,
  Alert,
  Modal,
  Animated,
  FlatList,
  ViewStyle,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAppStore } from '../store/appStore';
import { authApi } from '../services/authService';
import { LANGUAGES, changeLanguage as i18nChangeLanguage } from '../i18n';
import COLOR_PALETTE from '../styles/colorPalette';

const COLORS = {
  bg: '#0A0A0A',
  surface: '#17050A',
  border: 'rgba(255,194,209,0.15)',
  primary: COLOR_PALETTE.brightPink,
  primaryLight: COLOR_PALETTE.pink,
  textPrimary: COLOR_PALETTE.pink,
  textSecondary: COLOR_PALETTE.lavenderBlush,
  textMuted: 'rgba(255,194,209,0.4)',
  danger: '#ef4444',
  pillBg: '#17050A',
  pillActive: COLOR_PALETTE.pink,
};

const RadarRing = ({ delay }: { delay: number }) => {
  const scale = useRef(new Animated.Value(0.8)).current;
  const opacity = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(scale, {
            toValue: 2.2,
            duration: 2400,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0,
            duration: 2400,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(scale, {
            toValue: 0.8,
            duration: 0,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0.8,
            duration: 0,
            useNativeDriver: true,
          }),
        ]),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [scale, opacity, delay]);

  return (
    <Animated.View
      style={[
        styles.pulsingGlow,
        {
          transform: [{ scale }],
          opacity,
        },
      ]}
    />
  );
};

const PulsingGlow = () => {
  return (
    <>
      <RadarRing delay={0} />
      <RadarRing delay={800} />
      <RadarRing delay={1600} />
    </>
  );
};

interface SettingRowProps {
  iconName: string;
  iconType?: 'Ionicons' | 'MaterialCommunityIcons';
  label: string;
  value?: string;
  onPress?: () => void;
  isLast?: boolean;
  rightElement?: React.ReactNode;
  iconColor?: string;
  danger?: boolean;
}

const SettingRow = ({
  iconName,
  iconType = 'Ionicons',
  label,
  value,
  onPress,
  isLast,
  rightElement,
  iconColor = COLORS.primaryLight,
  danger,
}: SettingRowProps) => {
  const IconComponent =
    iconType === 'Ionicons' ? Ionicons : MaterialCommunityIcons;

  const content = (
    <View style={[styles.rowInner, !isLast && styles.rowBorder]}>
      <View style={styles.rowLeft}>
        <View style={[styles.iconWrap, danger && styles.iconWrapDanger]}>
          <IconComponent
            name={iconName}
            size={18}
            color={danger ? COLORS.danger : iconColor}
          />
        </View>
        <Text style={[styles.rowLabel, danger && styles.rowLabelDanger]}>
          {label}
        </Text>
      </View>
      <View style={styles.rowRight}>
        {rightElement ? (
          rightElement
        ) : (
          <>
            {value && <Text style={styles.rowValue}>{value}</Text>}
            <Ionicons
              name="chevron-forward"
              size={18}
              color={COLORS.textMuted}
            />
          </>
        )}
      </View>
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        style={styles.rowContainer}
        onPress={onPress}
        activeOpacity={0.7}
      >
        {content}
      </TouchableOpacity>
    );
  }
  return <View style={styles.rowContainer}>{content}</View>;
};

const SettingsScreen = () => {
  const { t } = useTranslation();
  const { language, setLanguage, theme, setTheme, setLogout } = useAppStore();
  const [isLanguageModalVisible, setIsLanguageModalVisible] = useState(false);
  const [notificationEnabled, setNotificationEnabled] = useState(true);
  const isDark = theme === 'dark';

  const slideUp = useRef(new Animated.Value(32)).current;
  const fadeIn = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeIn, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(slideUp, {
        toValue: 0,
        tension: 55,
        friction: 9,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeIn, slideUp]);

  const currentLang = LANGUAGES.find(l => l.code === language) || LANGUAGES[0];
  const langLabel = currentLang.nativeName;

  const handleLanguageSelect = (code: string) => {
    setLanguage(code);
    i18nChangeLanguage(code);
    setIsLanguageModalVisible(false);
  };

  const handleToggleDarkMode = (value: boolean) => {
    setTheme(value ? 'dark' : 'light');
  };

  const handleLogout = () => {
    Alert.alert(
      t('settings.logout_confirm_title'),
      t('settings.logout_confirm_message'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('settings.logout'),
          style: 'destructive',
          onPress: async () => {
            try {
              await authApi.logout?.();
            } catch (error) {
              console.error('Logout API error:', error);
            } finally {
              await setLogout();
            }
          },
        },
      ],
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />

      <View style={styles.headerSection}>
        <View style={styles.headerIconWrap}>
          <PulsingGlow />
          <Ionicons name="settings" size={40} color={COLOR_PALETTE.pink} />
        </View>
      </View>

      <Text style={styles.headerTitle}>{t('settings.title')}</Text>

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        style={{ opacity: fadeIn, transform: [{ translateY: slideUp }] }}
      >
        <Text style={styles.sectionTitle}>CÀI ĐẶT ỨNG DỤNG</Text>
        <View style={styles.cardGroup}>
          <SettingRow
            iconName="language-outline"
            label={t('settings.language')}
            value={langLabel}
            onPress={() => setIsLanguageModalVisible(true)}
          />

          <SettingRow
            iconName="notifications-outline"
            label={t('settings.notifications')}
            rightElement={
              <View style={styles.pillToggle}>
                <TouchableOpacity
                  style={[
                    styles.pillBtn,
                    notificationEnabled && styles.pillBtnActive,
                  ]}
                  onPress={() => setNotificationEnabled(true)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.pillBtnText,
                      notificationEnabled && styles.pillBtnTextActive,
                    ]}
                  >
                    ON
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.pillBtn,
                    !notificationEnabled && styles.pillBtnActive,
                  ]}
                  onPress={() => setNotificationEnabled(false)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.pillBtnText,
                      !notificationEnabled && styles.pillBtnTextActive,
                    ]}
                  >
                    OFF
                  </Text>
                </TouchableOpacity>
              </View>
            }
          />

          <SettingRow
            iconName="moon-outline"
            label={t('settings.dark_mode')}
            isLast
            rightElement={
              <Switch
                value={isDark}
                onValueChange={handleToggleDarkMode}
                trackColor={{ false: COLORS.pillBg, true: COLORS.primary }}
                thumbColor={'#ffffff'}
                ios_backgroundColor={COLORS.pillBg}
              />
            }
          />
        </View>

        <Text style={styles.sectionTitle}>TÀI KHOẢN</Text>
        <View style={[styles.cardGroup, styles.cardGroupMarginBottom]}>
          <SettingRow
            iconName="star"
            label={t('settings.upgrade_vip')}
            onPress={() => {}}
            iconColor={COLOR_PALETTE.lavenderBlush}
          />
          <SettingRow
            iconName="logout"
            iconType="MaterialCommunityIcons"
            label={t('settings.logout')}
            onPress={handleLogout}
            isLast
            danger
          />
        </View>
      </Animated.ScrollView>

      <Modal
        visible={isLanguageModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsLanguageModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('settings.language')}</Text>
              <TouchableOpacity
                onPress={() => setIsLanguageModalVisible(false)}
                style={styles.closeBtn}
              >
                <Ionicons name="close" size={24} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={LANGUAGES}
              keyExtractor={item => item.code}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.langItem,
                    language === item.code && styles.langItemActive,
                  ]}
                  onPress={() => handleLanguageSelect(item.code)}
                >
                  <View style={styles.langLeft}>
                    <Text style={styles.langFlag}>{item.flag}</Text>
                    <Text
                      style={[
                        styles.langText,
                        language === item.code && styles.langTextActive,
                      ]}
                    >
                      {item.nativeName}
                    </Text>
                  </View>
                  <View style={styles.radioOuter}>
                    {language === item.code && (
                      <View style={styles.radioInner} />
                    )}
                  </View>
                </TouchableOpacity>
              )}
              contentContainerStyle={styles.listContent}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default SettingsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },

  headerSection: {
    position: 'absolute',
    top: -20,
    left: 40,
    alignItems: 'center',
    paddingTop: 64,
    paddingBottom: 24,
  },
  headerIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 60,
    backgroundColor: 'black',
    borderWidth: 1,
    borderColor: 'rgba(255,194,209,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    ...({
      boxShadow: '0px 0px 20px 0px rgba(255,194,209,0.2)',
    } as ViewStyle),
  },
  pulsingGlow: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 70,
    borderWidth: 1.5,
    borderColor: COLOR_PALETTE.pink,
    ...({
      boxShadow: '0px 0px 8px 0px rgba(255,194,209,0.6)',
    } as ViewStyle),
  },
  scrollContent: {
    position: 'absolute',
    top: '20%',
    width: '100%',
    paddingHorizontal: 24,
    paddingBottom: 60,
  },
  headerTitle: {
    position: 'absolute',
    top: '8%',
    right: 32,
    color: COLOR_PALETTE.pink,
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 2,
    textShadowColor: COLOR_PALETTE.brightPink,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
    textTransform: 'uppercase',
  },
  headerSubtitle: {
    color: 'rgba(255,194,209,0.5)',
    fontSize: 14,
    fontWeight: '500',
    marginTop: 6,
    letterSpacing: 0.5,
  },

  sectionTitle: {
    color: COLOR_PALETTE.pink,
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginTop: 4,
    marginBottom: 12,
    marginLeft: 16,
    opacity: 0.8,
  },

  cardGroup: {
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: 'rgba(255,194,209,0.15)',
    backgroundColor: 'black',
    overflow: 'hidden',
    ...({
      boxShadow: 'inset 0px -2px 4px 0px pink',
    } as ViewStyle),
    marginBottom: 20,
  },
  cardGroupMarginBottom: {
    marginBottom: 40,
  },

  rowContainer: {
    paddingHorizontal: 16,
  },
  rowInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 18,
    minHeight: 64,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 194, 209, 0.05)',
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#17050A',
    borderWidth: 1,
    borderColor: 'rgba(255,194,209,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    ...({
      boxShadow: 'inset 0px 0px 8px 0px rgba(255,194,209,0.25)',
    } as ViewStyle),
  },
  iconWrapDanger: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  rowLabel: {
    color: COLOR_PALETTE.lavenderBlush,
    fontSize: 15,
    fontWeight: '600',
  },
  rowLabelDanger: {
    color: COLORS.danger,
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rowValue: {
    color: COLORS.textSecondary,
    fontSize: 15,
  },

  pillToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: COLORS.pillBg,
    padding: 3,
  },
  pillBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 50,
  },
  pillBtnActive: {
    backgroundColor: COLOR_PALETTE.pink,
    ...({
      boxShadow: '0px -2px 4px 0px pink',
    } as ViewStyle),
  },
  pillBtnText: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  pillBtnTextActive: {
    color: 'black',
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    width: '100%',
    backgroundColor: 'black',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    borderWidth: 1.5,
    borderBottomWidth: 0,
    borderColor: 'rgba(255,194,209,0.2)',
    ...({
      boxShadow: 'inset 0px 1px 4px 0px pink',
    } as ViewStyle),
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 32,
    maxHeight: '80%',
    transform: [{ translateY: 20 }],
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    color: COLORS.textPrimary,
    fontSize: 20,
    fontWeight: '800',
  },
  closeBtn: {
    padding: 4,
    backgroundColor: COLORS.pillBg,
    borderRadius: 20,
  },
  listContent: {
    paddingBottom: 16,
  },
  langItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  langItemActive: {
    backgroundColor: 'rgba(247, 215, 223, 0.08)',
    borderColor: 'rgba(255, 77, 109, 0.3)',
    ...({
      boxShadow: 'inset 0px 1px 2px 0px pink',
    } as ViewStyle),
  },
  langLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  langFlag: {
    fontSize: 24,
  },
  langText: {
    color: COLORS.textSecondary,
    fontSize: 16,
    fontWeight: '500',
  },
  langTextActive: {
    color: COLORS.primaryLight,
    fontWeight: 'bold',
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: COLOR_PALETTE.cherryBlossomPink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLOR_PALETTE.pink,
  },
});
