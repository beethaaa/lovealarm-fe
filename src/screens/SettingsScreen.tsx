import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Alert,
  Modal,
  FlatList,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAppStore } from '../store/appStore';
import { authApi } from '../services/authService';
import { LANGUAGES, changeLanguage as i18nChangeLanguage } from '../i18n';

const COLORS = {
  bg: '#000000',
  border: '#1a1a1a',
  primary: '#f472b6',
  primaryLight: '#fce7f3',
  textPrimary: '#ffffff',
  textSecondary: '#888888',
  pillBg: '#1a0a10',
  pillActive: '#f9a8d4',
  pillActiveText: '#000000',
  pillInactiveText: '#aaaaaa',
  pillSeparator: '#f472b633',
};

// ─── Divider ────────────────────────────────────────────────────────────────
const Divider = () => <View style={styles.divider} />;
const ModalDivider = () => <View style={styles.modalDivider} />;

const SettingsScreen = () => {
  const { t } = useTranslation();
  const { language, setLanguage, theme, setTheme, setLogout } = useAppStore();
  const [isLanguageModalVisible, setIsLanguageModalVisible] = useState(false);
  const [notificationEnabled, setNotificationEnabled] = useState(true);
  const isDark = theme === 'dark';

  // Derive current language display name
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

      {/* ── Header ── */}
      <View style={styles.header}>
        <Ionicons name="settings-outline" size={24} color={COLORS.primary} />
        <Text style={styles.headerTitle}>{t('settings.title')}</Text>
      </View>

      <View style={styles.headerDivider} />

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* ── Language ── */}
        <TouchableOpacity
          style={styles.row}
          activeOpacity={0.7}
          onPress={() => setIsLanguageModalVisible(true)}
        >
          <Text style={styles.rowLabel}>{t('settings.language')}</Text>
          <View style={styles.rowRight}>
            <Text style={styles.rowValue}>{langLabel}</Text>
            <Text style={styles.chevron}>›</Text>
          </View>
        </TouchableOpacity>

        <Divider />

        {/* ── App Notification ── */}
        <View style={styles.row}>
          <Text style={styles.rowLabel}>{t('settings.notifications')}</Text>
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
                {t('settings.enable')}
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
                {t('settings.disable')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <Divider />

        {/* ── Dark Mode ── */}
        <View style={styles.row}>
          <Text style={styles.rowLabel}>{t('settings.dark_mode')}</Text>
          <Switch
            value={isDark}
            onValueChange={handleToggleDarkMode}
            trackColor={{ false: '#333333', true: COLORS.primary }}
            thumbColor={isDark ? '#ffffff' : '#888888'}
          />
        </View>

        <Divider />

        {/* ── Upgrade to VIP ── */}
        <TouchableOpacity style={styles.row} activeOpacity={0.7}>
          <Text style={styles.rowLabel}>{t('settings.upgrade_vip')}</Text>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>

        <Divider />

        {/* ── Logout ── */}
        <TouchableOpacity
          style={styles.row}
          onPress={handleLogout}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons
            name="logout"
            size={22}
            color={COLORS.pillActive}
            style={styles.logoutIcon}
          />
          <Text style={styles.logoutLabel}>{t('settings.logout')}</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* ── Language Modal ── */}
      <Modal
        visible={isLanguageModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsLanguageModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setIsLanguageModalVisible(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t('settings.language')}</Text>
            <FlatList
              data={LANGUAGES}
              keyExtractor={item => item.code}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.langItem}
                  onPress={() => handleLanguageSelect(item.code)}
                >
                  <Text style={styles.langFlag}>{item.flag}</Text>
                  <Text
                    style={[
                      styles.langText,
                      language === item.code && styles.langTextActive,
                    ]}
                  >
                    {item.nativeName}
                  </Text>
                  {language === item.code && (
                    <Ionicons
                      name="checkmark"
                      size={20}
                      color={COLORS.primary}
                    />
                  )}
                </TouchableOpacity>
              )}
              ItemSeparatorComponent={ModalDivider}
            />
          </View>
        </TouchableOpacity>
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

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 20,
    gap: 10,
  },

  headerTitle: {
    color: COLORS.textPrimary,
    fontSize: 22,
    fontWeight: 'bold',
  },

  // Header divider
  headerDivider: {
    height: 1.5,
    backgroundColor: '#cccccc',
    marginHorizontal: 20,
  },

  // Divider
  divider: {
    height: 1,
    backgroundColor: '#222222',
    marginHorizontal: 20,
  },

  // Rows
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 18,
    minHeight: 56,
  },
  rowLabel: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rowValue: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  chevron: {
    color: COLORS.textSecondary,
    fontSize: 22,
    lineHeight: 24,
  },

  // Pill toggle
  pillToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    padding: 3,
  },
  pillBtn: {
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 70,
  },
  pillBtnActive: {
    backgroundColor: '#ffffff',
  },
  pillBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  pillBtnTextActive: {
    color: COLORS.primary,
    fontWeight: '700',
  },

  // Logout
  logoutIcon: {
    fontSize: 18,
    color: COLORS.primary,
    marginRight: 12,
  },
  logoutLabel: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    backgroundColor: '#111111',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#333333',
  },
  modalTitle: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  langItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
  },
  langFlag: {
    fontSize: 20,
    marginRight: 15,
  },
  langText: {
    color: COLORS.textSecondary,
    fontSize: 16,
    flex: 1,
  },
  langTextActive: {
    color: COLORS.textPrimary,
    fontWeight: 'bold',
  },
  modalDivider: {
    height: 1,
    backgroundColor: '#222222',
  },
});
