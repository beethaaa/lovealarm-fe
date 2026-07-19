import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';

interface InnerShadowBoxProps {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  backgroundColor?: string;
  shadowColor?: string;
  offsetX?: number;
  offsetY?: number;
  blurRadius?: number;
  spreadRadius?: number;
}

const InnerShadowBox = ({
  children,
  style,
  backgroundColor = '#0A0A0A',
  shadowColor = '#F5C9C6',
  offsetX = 0,
  offsetY = 1,
  blurRadius = 4,
  spreadRadius = 0,
}: InnerShadowBoxProps) => {
  const boxShadowValue = `inset ${offsetX}px ${offsetY}px ${blurRadius}px ${spreadRadius}px ${shadowColor}`;

  return (
    <View
      style={[
        styles.base,
        { backgroundColor },
        { boxShadow: boxShadowValue } as ViewStyle,
        style,
      ]}
    >
      {children}
    </View>
  );
};

export default InnerShadowBox;

const styles = StyleSheet.create({
  base: {
    borderRadius: 16,
    padding: 16,
  },
});
