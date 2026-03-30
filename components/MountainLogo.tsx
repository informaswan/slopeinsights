import React from 'react';
import { View } from 'react-native';
import Svg, { Polygon, Line } from 'react-native-svg';

interface Props {
  size?: number;
  color?: string;
  snowColor?: string;
}

export function MountainLogo({ size = 64, color = '#ffffff', snowColor = '#BAE6FD' }: Props) {
  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} viewBox="0 0 64 64">
        <Polygon
          points="32,8 52,48 12,48"
          fill="none"
          stroke={color}
          strokeWidth="3"
          strokeLinejoin="round"
        />
        <Polygon
          points="32,20 42,42 22,42"
          fill={color + '33'}
          stroke={color}
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <Line
          x1="24" y1="36" x2="40" y2="36"
          stroke={snowColor}
          strokeWidth="2"
          opacity={0.6}
        />
      </Svg>
    </View>
  );
}
