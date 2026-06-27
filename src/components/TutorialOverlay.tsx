import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, ViewStyle } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useAppStore } from '@/store/appStore';

const { width: W, height: H } = Dimensions.get('window');

const TUTORIAL_STEPS = [
  {
    target: 'scan',
    text: 'Chào mừng bạn đến với DearU, bạn đã sẵn sàng "rung chuông" để gặp định mệnh của mình chưa?',
  },
  {
    target: 'scan',
    text: 'Nhấn giữ "trái tim" để mở ra menu các tính năng khác',
  },
  {
    target: 'home',
    angle: 150,
    icon: 'home-outline',
    text: 'Trang chủ: Xem radar dò tìm và kết nối các trái tim xung quanh bạn',
  },
  {
    target: 'matched',
    angle: 110,
    icon: 'people-outline',
    text: 'Đã ghép đôi: Danh sách những người đang "rung chuông" với bạn',
  },
  {
    target: 'profile',
    angle: 70,
    icon: 'person-outline',
    text: 'Hồ sơ: Cập nhật thông tin cá nhân và hình ảnh của bạn',
  },
  {
    target: 'settings',
    angle: 30,
    icon: 'settings-outline',
    text: 'Cài đặt: Tùy chỉnh ngôn ngữ, thông báo, và trợ giúp',
  }
];

const getStepConfig = (step: typeof TUTORIAL_STEPS[0]) => {
  if (step.target === 'scan') {
    return {
      ...step,
      cx: W / 2,
      cy: H - 100, 
      radius: 55,  
    };
  } else {
    const rad = (step.angle! * Math.PI) / 180;
    const cx = W / 2 + 115 * Math.cos(rad);
    const cy = H - 80 - 115 * Math.sin(rad); 
    return {
      ...step,
      cx,
      cy,
      radius: 35,
    };
  }
};

const TutorialOverlay = () => {
  const { hasSeenTutorial, setHasSeenTutorial } = useAppStore();
  const [stepIndex, setStepIndex] = useState(0);

  const current = useMemo(() => getStepConfig(TUTORIAL_STEPS[stepIndex]), [stepIndex]);

  if (hasSeenTutorial) return null;

  const handleNext = () => {
    if (stepIndex < TUTORIAL_STEPS.length - 1) {
      setStepIndex(stepIndex + 1);
    } else {
      setHasSeenTutorial(true);
    }
  };

  const BORDER = 3000; 

  return (
    <View style={styles.overlayContainer} pointerEvents="auto">
      <View
        style={[
          styles.spotlightHole,
          {
            left: current.cx - current.radius - BORDER,
            top: current.cy - current.radius - BORDER,
            width: current.radius * 2 + BORDER * 2,
            height: current.radius * 2 + BORDER * 2,
            borderRadius: current.radius + BORDER,
            borderWidth: BORDER,
          }
        ]}
        pointerEvents="none"
      />

      <View style={[
         styles.ringGlow,
         {
           left: current.cx - current.radius,
           top: current.cy - current.radius,
           width: current.radius * 2,
           height: current.radius * 2,
           borderRadius: current.radius,
         }
      ]} pointerEvents="none" />

      {current.icon && (
        <View style={[
          styles.fakeButton,
          {
            left: current.cx - 27,
            top: current.cy - 27,
          }
        ]}>
           <Icon name={current.icon} size={20} color="#F5C9C6" />
        </View>
      )}

      <View style={[
        styles.tooltipWrapper,
        { height: current.cy - current.radius }
      ]} pointerEvents="auto">
        
        <TouchableOpacity style={styles.box} activeOpacity={0.8} onPress={handleNext}>
          <Text style={styles.text}>{current.text}</Text>
          <Icon name={current.icon ? "chevron-forward" : "arrow-forward-circle"} size={26} color="#FFF" />
        </TouchableOpacity>

        <View style={[styles.pointerLine, {
          left: current.cx - 0.75, 
        }]} />
        
      </View>
    </View>
  );
};

export default TutorialOverlay;

const styles = StyleSheet.create({
  overlayContainer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
  },
  spotlightHole: {
    position: 'absolute',
    borderColor: 'rgba(10, 10, 10, 0.85)',
  },
  ringGlow: {
    position: 'absolute',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 194, 209, 0.4)',
    ...({ boxShadow: 'inset 0px 0px 20px 0px rgba(255, 194, 209, 0.25)' } as ViewStyle),
  },
  fakeButton: {
    position: 'absolute',
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#2A0A14',
    alignItems: 'center',
    justifyContent: 'center',
    ...({ boxShadow: 'inset 0px -1px 5px 0px #F5C9C6' } as ViewStyle),
  },
  tooltipWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  box: {
    position: 'absolute',
    left: 24,
    width: W - 48,
    bottom: 56,
    backgroundColor: '#0A0A0A',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 194, 209, 0.35)',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 18,
    flexDirection: 'row',
    alignItems: 'center',
    ...({ boxShadow: '0px 8px 30px 0px rgba(255, 194, 209, 0.15)' } as ViewStyle),
  },
  text: {
    flex: 1,
    color: '#FFF',
    fontSize: 14,
    lineHeight: 22,
    fontWeight: '600',
    marginRight: 12,
  },
  pointerLine: {
    position: 'absolute',
    bottom: 0,
    width: 1.5,
    height: 56,
    backgroundColor: 'rgba(255, 194, 209, 0.6)',
  },
});
