import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  StyleSheet,
  Alert, // Thêm Alert để hiển thị thông báo xác nhận
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { LANGUAGES } from '../i18n';
import { useAppStore } from '../store/appStore';
import { authApi } from '../services/authService'; // Đảm bảo đã import authApi

const COLORS = {
  bg: '#0f172a',
  surface: '#1e293b',
  surfaceDeep: '#0f172a',
  border: '#334155',
  primary: '#ec4899',
  textPrimary: '#ffffff',
  textSecondary: '#94a3b8',
  textMuted: '#475569',
};

const SettingSection = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>{title}</Text>
    <View style={styles.sectionBody}>{children}</View>
  </View>
);

const SettingRow = ({
  emoji,
  label,
  value,
  onPress,
  children,
  isLast = false,
  danger = false,
}: {
  emoji: string;
  label: string;
  value?: string;
  onPress?: () => void;
  children?: React.ReactNode;
  isLast?: boolean;
  danger?: boolean;
}) => (
  <TouchableOpacity
    onPress={onPress}
    disabled={!onPress && !children}
    style={[styles.settingRow, !isLast && styles.settingRowBorder]}
    activeOpacity={onPress ? 0.6 : 1}
  >
    <View style={styles.settingIconWrap}>
      <Text style={styles.settingIcon}>{emoji}</Text>
    </View>
    <Text style={[styles.settingLabel, danger && { color: '#ff4d6d' }]}>
      {label}
    </Text>
    {children || (
      <>
        {value && <Text style={styles.settingValue}>{value}</Text>}
        {onPress && <Text style={styles.settingChevron}>›</Text>}
      </>
    )}
  </TouchableOpacity>
);

const SettingsScreen = () => {
  const { t } = useTranslation();
  const { language, setLanguage, theme, setTheme, setLogout } = useAppStore(); // Lấy setLogout từ store

  // Logic xử lý khi nhấn nút Logout
  const handleLogout = () => {
    Alert.alert(
      // t('settings.logout_title') || 'Đăng xuất',
      // t('settings.logout_confirm') ||
      //   'Bạn có chắc chắn muốn đăng xuất khỏi ứng dụng không?',
      'Đăng xuất',
      'Bạn có chắc chắn muốn đăng xuất khỏi ứng dụng không?',
      [
        {
          // text: t('common.cancel') || 'Hủy',
          text: 'Hủy',
          style: 'cancel',
        },
        {
          // text: t('settings.logout_button') || 'Đăng xuất',
          text: 'Đăng xuất',
          style: 'destructive',
          onPress: async () => {
            try {
              // Gọi API logout lên server (nếu cần theo hình image_be24f2.png)
              await authApi.logout?.();
            } catch (error) {
              console.log('Logout API error:', error);
            } finally {
              // Xóa token trong AsyncStorage và cập nhật isLoggedIn về false
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

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('settings.title')}</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Language Section */}
        <SettingSection title={t('settings.language')}>
          {LANGUAGES.map((lang: (typeof LANGUAGES)[0], i: number) => (
            <TouchableOpacity
              key={lang.code}
              onPress={() => setLanguage(lang.code)}
              style={[
                styles.settingRow,
                i < LANGUAGES.length - 1 && styles.settingRowBorder,
              ]}
              activeOpacity={0.7}
            >
              <Text style={styles.langFlag}>{lang.flag}</Text>
              <View style={styles.langInfo}>
                <Text style={styles.settingLabel}>{lang.nativeName}</Text>
                <Text style={styles.langSubName}>{lang.name}</Text>
              </View>
              {language === lang.code && (
                <View style={styles.checkBadge}>
                  <Text style={styles.checkBadgeText}>✓</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </SettingSection>

        {/* Theme Section */}
        <SettingSection title={t('settings.theme')}>
          {(
            [
              {
                key: 'light' as const,
                label: t('settings.light_mode'),
                emoji: '☀️',
              },
              {
                key: 'dark' as const,
                label: t('settings.dark_mode'),
                emoji: '🌙',
              },
              {
                key: 'system' as const,
                label: t('settings.system_mode'),
                emoji: '📱',
              },
            ] as const
          ).map((item, i) => (
            <TouchableOpacity
              key={item.key}
              onPress={() => setTheme(item.key)}
              style={[styles.settingRow, i < 2 && styles.settingRowBorder]}
              activeOpacity={0.7}
            >
              <Text style={styles.themeEmoji}>{item.emoji}</Text>
              <Text style={[styles.settingLabel]}>{item.label}</Text>
              {theme === item.key && (
                <View style={styles.checkBadge}>
                  <Text style={styles.checkBadgeText}>✓</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </SettingSection>

        {/* Bluetooth Section */}
        <SettingSection title={t('settings.bluetooth')}>
          <SettingRow
            emoji="🔵"
            label={t('settings.bluetooth')}
            value={t('settings.bluetooth_desc')}
            isLast={true}
          />
        </SettingSection>

        {/* About Section */}
        <SettingSection title={t('settings.about')}>
          <SettingRow emoji="ℹ️" label={t('settings.about')} />
          <SettingRow
            emoji="📱"
            label={t('settings.version', { version: '1.0.0' })}
            isLast={true}
          />
        </SettingSection>

        {/* MỤC LOGOUT MỚI THÊM */}
        {/* <SettingSection title={t('settings.account') || 'Tài khoản'}> */}
        <SettingSection title={'Đăng xuất'}>
          <SettingRow
            emoji="🚪"
            // label={t('settings.logout') || 'Đăng xuất'}
            label={'Đăng xuất  '}
            onPress={handleLogout}
            danger={true}
            isLast={true}
          />
        </SettingSection>

        <View style={styles.footer}>
          <Text style={styles.footerHeart}>💗</Text>
          <Text style={styles.footerApp}>Love Alarm</Text>
          <Text style={styles.footerSub}>
            Built with ♥ using React Native CLI
          </Text>
          <Text style={styles.footerStack}>BLE • i18n • Zustand</Text>
        </View>
      </ScrollView>
    </View>
  );
};

export default SettingsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 56,
    paddingBottom: 24,
  },
  headerTitle: {
    color: COLORS.textPrimary,
    fontSize: 28,
    fontWeight: 'bold',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: COLORS.primary,
    fontSize: 11,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 2,
    paddingHorizontal: 24,
    marginBottom: 8,
  },
  sectionBody: {
    backgroundColor: COLORS.surface,
    marginHorizontal: 16,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  settingRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  settingIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: COLORS.surfaceDeep,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  settingIcon: {
    fontSize: 16,
  },
  settingLabel: {
    color: COLORS.textPrimary,
    fontWeight: '500',
    fontSize: 15,
  },
  settingValue: {
    color: COLORS.textSecondary,
    fontSize: 14,
    marginRight: 8,
  },
  settingChevron: {
    color: COLORS.textSecondary,
    fontSize: 20,
  },
  langFlag: {
    fontSize: 24,
    marginRight: 12,
  },
  langInfo: {
    flex: 1,
  },
  langSubName: {
    color: COLORS.textMuted,
    fontSize: 12,
  },
  themeEmoji: {
    fontSize: 20,
    marginRight: 12,
  },
  checkBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkBadgeText: {
    color: COLORS.textPrimary,
    fontSize: 12,
    fontWeight: 'bold',
  },
  footer: {
    alignItems: 'center',
    paddingBottom: 40,
    paddingTop: 16,
  },
  footerHeart: {
    fontSize: 36,
    marginBottom: 8,
  },
  footerApp: {
    color: COLORS.textPrimary,
    fontWeight: 'bold',
    fontSize: 18,
  },
  footerSub: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 4,
  },
  footerStack: {
    color: '#1e293b',
    fontSize: 12,
    marginTop: 4,
  },
});
