import React, { useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator, Animated, Text } from 'react-native';
import COLOR_PALETTE from '@/styles/colorPalette';

interface LoadingOverlayProps {
  visible: boolean;
  message?: string;
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ visible, message = 'Loading...' }) => {
  const [shouldRender, setShouldRender] = React.useState(visible);
  const opacity = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setShouldRender(true);
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(opacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        setShouldRender(false);
      });
    }
  }, [visible, opacity]);

  if (!shouldRender) return null;

  return (
    <Animated.View 
      style={[styles.container, { opacity }]}
      pointerEvents={visible ? 'auto' : 'none'}
    >
      <View style={styles.loaderWrapper}>
        <ActivityIndicator size="large" color={COLOR_PALETTE.pink} />
        <Text style={styles.text}>{message}</Text>
      </View>
    </Animated.View>
  );
};

export default LoadingOverlay;

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(5, 5, 5, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  loaderWrapper: {
    padding: 30,
    borderRadius: 20,
    backgroundColor: '#0D0D0D',
    borderWidth: 1,
    borderColor: 'rgba(255, 194, 209, 0.2)',
    alignItems: 'center',
    gap: 15,
    shadowColor: COLOR_PALETTE.pink,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 10,
  },
  text: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
    opacity: 0.8,
  },
});
