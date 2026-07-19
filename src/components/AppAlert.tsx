import React from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

export type AppAlertVariant = 'info' | 'success' | 'error';

export type AppAlertConfig = {
  title: string;
  message: string;
  variant?: AppAlertVariant;
  confirmText?: string;
  onConfirm?: () => void;
};

type AppAlertProps = AppAlertConfig & {
  visible: boolean;
  onClose: () => void;
};

const variantMeta = {
  info: {
    icon: 'sparkles-outline',
    color: '#ffbdd5',
  },
  success: {
    icon: 'checkmark-circle-outline',
    color: '#ffc7dc',
  },
  error: {
    icon: 'alert-circle-outline',
    color: '#ff8fad',
  },
} as const;

const AppAlert = ({
  visible,
  title,
  message,
  variant = 'info',
  confirmText = 'OK',
  onClose,
}: AppAlertProps) => {
  const meta = variantMeta[variant];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.card}>
          <View style={[styles.iconWrap, { borderColor: meta.color }]}>
            <Icon name={meta.icon} size={28} color={meta.color} />
          </View>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>

          <TouchableOpacity
            activeOpacity={0.84}
            style={styles.button}
            onPress={onClose}
          >
            <Text style={styles.buttonText}>{confirmText}</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

export default AppAlert;

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    paddingHorizontal: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(2,0,2,0.72)',
  },
  card: {
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: 'rgba(255,212,228,0.44)',
    backgroundColor: 'rgba(8,1,8,0.96)',
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 22,
    shadowColor: '#f9a2cb',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.36,
    shadowRadius: 18,
    elevation: 14,
  },
  iconWrap: {
    width: 58,
    height: 58,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 29,
    borderWidth: 1,
    backgroundColor: 'rgba(255,221,233,0.08)',
    marginBottom: 16,
  },
  title: {
    color: '#ffe1ec',
    fontSize: 22,
    fontFamily: 'serif',
    fontWeight: 'bold',
    textAlign: 'center',
    textShadowColor: '#c12a7f',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 9,
  },
  message: {
    marginTop: 10,
    color: 'rgba(255,232,241,0.78)',
    fontSize: 15,
    lineHeight: 22,
    fontFamily: 'serif',
    fontWeight: '600',
    textAlign: 'center',
  },
  button: {
    minWidth: 150,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,213,229,0.46)',
    backgroundColor: 'rgba(255,194,209,0.18)',
    marginTop: 22,
    paddingHorizontal: 22,
  },
  buttonText: {
    color: '#ffe8f1',
    fontSize: 15,
    fontFamily: 'serif',
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
