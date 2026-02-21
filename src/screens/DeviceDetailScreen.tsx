import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  StatusBar,
  StyleSheet,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { RouteProp, useRoute } from '@react-navigation/native';
import { bleService } from '../services/ble/BleService';
import { useBleStore } from '../store/bleStore';
import { RootStackParamList } from '../types/index';

type DeviceDetailRouteProp = RouteProp<RootStackParamList, 'DeviceDetail'>;

interface ServiceInfo {
  uuid: string;
  characteristics: string[];
}

// Color palette
const COLORS = {
  bg: '#0f172a',
  surface: '#1e293b',
  surfaceDeep: '#0f172a',
  border: '#334155',
  primary: '#ec4899',
  textPrimary: '#ffffff',
  textSecondary: '#94a3b8',
  textMuted: '#475569',
  green: '#22c55e',
  greenBg: '#14532d',
};

const InfoRow = ({ label, value }: { label: string; value: string }) => (
  <View style={styles.infoRow}>
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={styles.infoValue} numberOfLines={2}>
      {value}
    </Text>
  </View>
);

const DeviceDetailScreen = () => {
  const { t } = useTranslation();
  const route = useRoute<DeviceDetailRouteProp>();
  const { deviceId, deviceName } = route.params;
  const { devices, connectedDeviceId } = useBleStore();

  const [services, setServices] = useState<ServiceInfo[]>([]);
  const [loadingServices, setLoadingServices] = useState(false);

  const device = devices.find(d => d.id === deviceId);
  const isConnected = connectedDeviceId === deviceId;

  const loadServices = useCallback(async () => {
    try {
      setLoadingServices(true);
      const deviceServices = await bleService.getServicesForDevice(deviceId);
      const serviceInfos: ServiceInfo[] = await Promise.all(
        deviceServices.map(async service => {
          const characteristics = await service.characteristics();
          return {
            uuid: service.uuid,
            characteristics: characteristics.map(c => c.uuid),
          };
        }),
      );
      setServices(serviceInfos);
    } catch (error) {
      console.error('Failed to load services:', error);
    } finally {
      setLoadingServices(false);
    }
  }, [deviceId]);

  useEffect(() => {
    if (isConnected) {
      loadServices();
    }
  }, [isConnected, loadServices]);

  const getSignalStrength = (rssi: number | null) => {
    if (!rssi) return 'Unknown';
    if (rssi > -60) return `${rssi} dBm 🟢 Strong`;
    if (rssi > -80) return `${rssi} dBm 🟡 Medium`;
    return `${rssi} dBm 🔴 Weak`;
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Device Header Card */}
        <View style={styles.headerCard}>
          <View style={styles.deviceIconWrap}>
            <Text style={styles.deviceIconText}>
              {isConnected ? '🔗' : '📱'}
            </Text>
          </View>
          <Text style={styles.deviceName}>
            {deviceName || 'Unknown Device'}
          </Text>
          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor: isConnected ? COLORS.greenBg : COLORS.surface,
              },
            ]}
          >
            <Text
              style={[
                styles.statusBadgeText,
                { color: isConnected ? COLORS.green : COLORS.textMuted },
              ]}
            >
              {isConnected
                ? `● ${t('ble.connected')}`
                : `○ ${t('ble.disconnected')}`}
            </Text>
          </View>
        </View>

        {/* Device Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('ble.device_name')} Info</Text>
          <InfoRow label={t('ble.device_id')} value={deviceId} />
          <InfoRow
            label={t('ble.device_name')}
            value={deviceName || 'Unknown'}
          />
          <InfoRow
            label={t('ble.signal_strength')}
            value={getSignalStrength(device?.rssi ?? null)}
          />
          <InfoRow
            label="Connectable"
            value={device?.isConnectable ? 'Yes' : 'No'}
          />
          {device?.lastSeen && (
            <InfoRow
              label="Last Seen"
              value={device.lastSeen.toLocaleTimeString()}
            />
          )}
        </View>

        {/* Services */}
        {isConnected && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('ble.services')}</Text>
            {loadingServices ? (
              <ActivityIndicator color={COLORS.primary} />
            ) : services.length === 0 ? (
              <Text style={styles.noServicesText}>No services available</Text>
            ) : (
              services.map((service, i) => (
                <View key={service.uuid} style={styles.serviceItem}>
                  <View style={styles.serviceHeader}>
                    <Text style={styles.serviceLabel}>
                      {t('ble.services')} {i + 1}
                    </Text>
                    <Text style={styles.serviceUuid}>{service.uuid}</Text>
                  </View>
                  {service.characteristics.map(char => (
                    <View key={char} style={styles.charItem}>
                      <Text style={styles.charText}>→ {char}</Text>
                    </View>
                  ))}
                </View>
              ))
            )}
          </View>
        )}

        {/* Service UUIDs from scan */}
        {device?.serviceUUIDs &&
          device.serviceUUIDs.length > 0 &&
          !isConnected && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                Advertised {t('ble.services')}
              </Text>
              {device.serviceUUIDs.map((uuid, i) => (
                <View key={i} style={styles.uuidItem}>
                  <Text style={styles.uuidText}>{uuid}</Text>
                </View>
              ))}
            </View>
          )}
      </ScrollView>
    </View>
  );
};

export default DeviceDetailScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 16,
  },
  headerCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
  },
  deviceIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.surfaceDeep,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  deviceIconText: {
    fontSize: 40,
  },
  deviceName: {
    color: COLORS.textPrimary,
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  statusBadge: {
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderRadius: 999,
  },
  statusBadgeText: {
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingBottom: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  sectionTitle: {
    color: COLORS.primary,
    fontSize: 11,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 2,
    paddingTop: 16,
    paddingBottom: 8,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  infoLabel: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  infoValue: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
    marginLeft: 16,
  },
  noServicesText: {
    color: COLORS.textSecondary,
    textAlign: 'center',
    paddingVertical: 16,
  },
  serviceItem: {
    marginBottom: 12,
  },
  serviceHeader: {
    backgroundColor: COLORS.surfaceDeep,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  serviceLabel: {
    color: COLORS.primary,
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  serviceUuid: {
    color: COLORS.textPrimary,
    fontSize: 11,
    fontFamily: 'monospace',
  },
  charItem: {
    backgroundColor: COLORS.bg,
    borderRadius: 8,
    padding: 8,
    marginBottom: 4,
    marginLeft: 16,
  },
  charText: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontFamily: 'monospace',
  },
  uuidItem: {
    backgroundColor: COLORS.surfaceDeep,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  uuidText: {
    color: COLORS.textPrimary,
    fontSize: 11,
    fontFamily: 'monospace',
  },
});
