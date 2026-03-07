import React, { useRef, useState } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
  ViewStyle,
  TouchableWithoutFeedback,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

const blurBgHeight = Dimensions.get('window').height * 2; // cover everything

const { width: W } = Dimensions.get('window');

const GNB_HEIGHT = 280;
const ITEM_SIZE = 54;
const SCAN_SIZE = 88;

const SCAN_POS = { x: W / 2, y: 200 };

const CIRCLE_RADIUS = 115;

function circlePos(angleDeg: number) {
  const rad = (angleDeg * Math.PI) / 180;
  return {
    x: SCAN_POS.x + CIRCLE_RADIUS * Math.cos(rad),
    y: SCAN_POS.y - CIRCLE_RADIUS * Math.sin(rad),
  };
}

const SIDE_CONFIGS = [
  { key: 'home', icon: 'home-outline', angle: 150 },
  { key: 'matched', icon: 'people-outline', angle: 110 },
  { key: 'profile', icon: 'person-outline', angle: 70 },
  { key: 'settings', icon: 'settings-outline', angle: 30 },
];

export interface GNBProps {
  activeTab?: 'home' | 'matched' | 'scan' | 'profile' | 'settings';
  onHome?: () => void;
  onMatched?: () => void;
  onScan?: () => void;
  onProfile?: () => void;
  onSettings?: () => void;
  isScanning?: boolean;
}

const GNB: React.FC<GNBProps> = ({
  activeTab,
  onHome,
  onMatched,
  onScan,
  onProfile,
  onSettings,
  isScanning = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const expandAnim = useRef(new Animated.Value(0)).current;

  const btnScales = useRef(
    SIDE_CONFIGS.map(() => new Animated.Value(1)),
  ).current;

  const scanScale = useRef(new Animated.Value(1)).current;

  const expand = () => {
    setIsExpanded(true);
    Animated.spring(expandAnim, {
      toValue: 1,
      tension: 60,
      friction: 7,
      useNativeDriver: true,
    }).start();
  };

  const collapse = () => {
    Animated.spring(expandAnim, {
      toValue: 0,
      tension: 80,
      friction: 8,
      useNativeDriver: true,
    }).start(() => setIsExpanded(false));
  };

  const handleScanPress = () => {
    if (isExpanded) {
      collapse();
    } else {
      onScan?.();
    }
  };

  const handleLongPress = () => {
    isExpanded ? collapse() : expand();
  };

  const pressIn = (i: number) =>
    Animated.spring(btnScales[i], {
      toValue: 1.28,
      tension: 300,
      friction: 4,
      useNativeDriver: true,
    }).start();

  const pressOut = (i: number) =>
    Animated.spring(btnScales[i], {
      toValue: 1,
      tension: 250,
      friction: 7,
      useNativeDriver: true,
    }).start();

  const onPressCallbacks = [onHome, onMatched, onProfile, onSettings];

  return (
    <View style={styles.container} pointerEvents="box-none">
      <Animated.View
        pointerEvents={isExpanded ? 'auto' : 'none'}
        style={[
          styles.overlay,
          {
            opacity: expandAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 0.7],
            }),
          },
        ]}
      >
        <TouchableWithoutFeedback onPress={collapse}>
          <View style={StyleSheet.absoluteFill} />
        </TouchableWithoutFeedback>
      </Animated.View>

      <View pointerEvents={isExpanded ? 'auto' : 'none'}>
        {SIDE_CONFIGS.map((cfg, i) => {
          const pos = circlePos(cfg.angle);
          const isActive = activeTab === cfg.key;

          const translateX = expandAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [SCAN_POS.x - pos.x, 0],
          });
          const translateY = expandAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [SCAN_POS.y - pos.y, 0],
          });
          const opacity = expandAnim.interpolate({
            inputRange: [0, 0.3, 1],
            outputRange: [0, 0, 1],
          });
          const scaleFromCenter = expandAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [0.1, 1],
          });

          return (
            <Animated.View
              key={cfg.key}
              style={[
                styles.itemAbsolute,
                {
                  left: pos.x - ITEM_SIZE / 2,
                  top: pos.y - ITEM_SIZE / 2,
                  opacity,
                  transform: [
                    { translateX },
                    { translateY },
                    { scale: scaleFromCenter },
                  ],
                },
              ]}
            >
              <Animated.View style={{ transform: [{ scale: btnScales[i] }] }}>
                <TouchableOpacity
                  style={[
                    styles.itemCircle,
                    isActive && styles.itemCircleActive,
                  ]}
                  onPress={() => {
                    onPressCallbacks[i]?.();
                    collapse();
                  }}
                  onPressIn={() => pressIn(i)}
                  onPressOut={() => pressOut(i)}
                  activeOpacity={1}
                >
                  <Icon
                    name={cfg.icon}
                    size={20}
                    color={isActive ? '#F5C9C6' : '#B8869A'}
                  />
                </TouchableOpacity>
              </Animated.View>
            </Animated.View>
          );
        })}
      </View>

      <View
        style={[
          styles.itemAbsolute,
          {
            left: SCAN_POS.x - SCAN_SIZE / 2,
            top: SCAN_POS.y - SCAN_SIZE / 2 - 20,
            width: SCAN_SIZE,
            height: SCAN_SIZE,
          },
        ]}
      >
        <Animated.View style={{ transform: [{ scale: scanScale }] }}>
          <TouchableOpacity
            style={[styles.scanButton, isScanning && styles.scanButtonActive]}
            onPress={handleScanPress}
            onLongPress={handleLongPress}
            onPressIn={() =>
              Animated.spring(scanScale, {
                toValue: 0.9,
                tension: 300,
                friction: 4,
                useNativeDriver: true,
              }).start()
            }
            onPressOut={() =>
              Animated.spring(scanScale, {
                toValue: 1,
                tension: 200,
                friction: 6,
                useNativeDriver: true,
              }).start()
            }
            delayLongPress={350}
            activeOpacity={1}
          >
            <Icon
              name="heart"
              size={44}
              color={isScanning ? '#FF88AA' : '#ffd1c2'}
            />
          </TouchableOpacity>
        </Animated.View>
      </View>
    </View>
  );
};

export default GNB;


const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: GNB_HEIGHT,
    backgroundColor: 'transparent',
  },
  overlay: {
    position: 'absolute',
    bottom: 0,
    left: -W,
    right: -W,
    height: blurBgHeight,
    backgroundColor: '#000',
  },

  itemAbsolute: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },

  itemCircle: {
    width: ITEM_SIZE,
    height: ITEM_SIZE,
    borderRadius: ITEM_SIZE / 2,
    backgroundColor: '#1a1a1a',
    alignItems: 'center',
    justifyContent: 'center',
    ...({
      boxShadow: 'inset 0px -1px 3px 0px #F5B8C4',
    } as ViewStyle),
  },

  itemCircleActive: {
    backgroundColor: '#2A0A14',
    ...({
      boxShadow: 'inset 0px -1px 5px 0px #F5C9C6',
    } as ViewStyle),
  },

  scanButton: {
    width: SCAN_SIZE,
    height: SCAN_SIZE,
    borderRadius: SCAN_SIZE / 2,
    backgroundColor: '#1a1a1a',
    alignItems: 'center',
    justifyContent: 'center',
    ...({
      boxShadow: 'inset 0px -1px 4px 0px #F5B8C4',
    } as ViewStyle),
  },

  scanButtonActive: {
    backgroundColor: 'black',
    ...({
      boxShadow: 'inset 0px -2px 12px 0px pink',
    } as ViewStyle),
  },
});
