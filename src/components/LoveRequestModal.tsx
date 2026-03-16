import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import COLOR_PALETTE from '@/styles/colorPalette';
import Icon from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';

const { width: SW } = Dimensions.get('window');

interface UserInfo {
  _id: string;
  name: string;
  avatarUrl?: string;
}

interface LoveRequestModalProps {
  visible: boolean;
  onClose: () => void;
  onSend: () => void;
  currentUser: UserInfo;
  targetUser: UserInfo;
}

const LoveRequestModal = ({
  visible,
  onClose,
  onSend,
  currentUser,
  targetUser,
}: LoveRequestModalProps) => {
  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity
          activeOpacity={1}
          style={StyleSheet.absoluteFill}
          onPress={onClose}
        />

        <View style={styles.modalWrapper}>
          <LinearGradient
            colors={['#1A050A', '#0D0507', '#050505']}
            style={styles.modalContainer}
          >
            <View style={[styles.decorCircle, styles.decorTopLeft]} />
            <View style={[styles.decorCircle, styles.decorBottomRight]} />

            <View style={styles.heartIconHeader}>
              <Icon name="heart-circle" size={48} color={COLOR_PALETTE.pink} />
            </View>

            <Text style={styles.title}>Send Love Signal</Text>
            <Text style={styles.subtitle}>
              Let them know they've rang your alarm.
            </Text>

            <View style={styles.avatarRow}>
              <View style={styles.userContainer}>
                <LinearGradient
                  colors={[COLOR_PALETTE.mimiPink, COLOR_PALETTE.amaranthPink]}
                  style={styles.avatarGlow}
                >
                  <View style={styles.avatarWrapper}>
                    {currentUser.avatarUrl ? (
                      <Image
                        source={{ uri: currentUser.avatarUrl }}
                        style={styles.avatar}
                      />
                    ) : (
                      <View style={styles.avatarPlaceholder}>
                        <Text style={styles.initials}>
                          {currentUser.name?.[0]?.toUpperCase()}
                        </Text>
                      </View>
                    )}
                  </View>
                </LinearGradient>
                <Text style={styles.userName} numberOfLines={1}>
                  {currentUser.name}
                </Text>
              </View>

              <View style={styles.connectorContainer}>
                <View style={styles.connectorLine} />
                <View style={styles.heartPulseContainer}>
                  <Icon name="heart" size={20} color={COLOR_PALETTE.pink} />
                </View>
              </View>

              <View style={styles.userContainer}>
                <LinearGradient
                  colors={[COLOR_PALETTE.amaranthPink, COLOR_PALETTE.mimiPink]}
                  style={styles.avatarGlow}
                >
                  <View style={styles.avatarWrapper}>
                    {targetUser.avatarUrl ? (
                      <Image
                        source={{ uri: targetUser.avatarUrl }}
                        style={styles.avatar}
                      />
                    ) : (
                      <View style={styles.avatarPlaceholder}>
                        <Text style={styles.initials}>
                          {targetUser.name?.[0]?.toUpperCase()}
                        </Text>
                      </View>
                    )}
                  </View>
                </LinearGradient>
                <Text style={styles.userName} numberOfLines={1}>
                  {targetUser.name}
                </Text>
              </View>
            </View>

            <View style={styles.buttonRow}>
              <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                <Text style={styles.cancelButtonText}>Maybe Later</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={onSend} activeOpacity={0.8}>
                <LinearGradient
                  colors={[COLOR_PALETTE.salmonPink, COLOR_PALETTE.brightPink]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.sendButton}
                >
                  <Text style={styles.sendButtonText}>Send Signal</Text>
                  <Icon name="send" size={16} color="#FFF" />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalWrapper: {
    width: SW * 0.9,
    maxWidth: 400,
    borderRadius: 32,
    overflow: 'hidden',
    shadowColor: COLOR_PALETTE.pink,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  modalContainer: {
    padding: 30,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 194, 209, 0.15)',
    borderRadius: 32,
    boxShadow: 'inset 0px -1px 4px 0px #FFB2C5',
  },
  decorCircle: {
    position: 'absolute',
    borderRadius: 100,
  },
  decorTopLeft: {
    top: -20,
    left: -20,
    width: 80,
    height: 80,
    backgroundColor: COLOR_PALETTE.pink + '15',
  },
  decorBottomRight: {
    bottom: -30,
    right: -40,
    width: 120,
    height: 120,
    backgroundColor: COLOR_PALETTE.amaranthPink + '10',
  },
  heartIconHeader: {
    marginBottom: 16,
    shadowColor: COLOR_PALETTE.pink,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900',
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  subtitle: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 40,
    paddingHorizontal: 10,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 40,
    paddingHorizontal: 10,
  },
  userContainer: {
    alignItems: 'center',
    width: 80,
  },
  avatarGlow: {
    width: 76,
    height: 76,
    borderRadius: 38,
    padding: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: COLOR_PALETTE.pink,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
  },
  avatarWrapper: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#000',
    padding: 2,
  },
  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: 33,
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    borderRadius: 33,
    backgroundColor: '#1A080C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    color: COLOR_PALETTE.pink,
    fontSize: 28,
    fontWeight: 'bold',
  },
  userName: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  connectorContainer: {
    flex: 1,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  connectorLine: {
    width: '100%',
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    position: 'absolute',
  },
  heartPulseContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1A050A',
    borderWidth: 1,
    borderColor: 'rgba(255, 194, 209, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLOR_PALETTE.pink,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 5,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  cancelButton: {
    flex: 1,
    height: 40,
    borderRadius: 18,
    backgroundColor: '#0A0A0A',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: 'inset 0px -1px 4px 0px rgba(255, 255, 255, 0.15)',
  },
  cancelButtonText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 14,
    fontWeight: '500',
  },
  sendButton: {
    flex: 1,
    minWidth: 140,
    height: 54,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    boxShadow: 'inset 0px -1px 6px 0px rgba(255, 255, 255, 0.4)',
  },
  sendButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default LoveRequestModal;
