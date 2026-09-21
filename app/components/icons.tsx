import React from 'react';
import Svg, { Circle, Path } from 'react-native-svg';

interface IconProps {
  size?: number;
  color: string;
}

function Icon({ size = 16, color, children }: IconProps & { children: React.ReactNode }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color}
      strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      {children}
    </Svg>
  );
}

export const SearchIcon = (p: IconProps) => (
  <Icon {...p}><Circle cx="11" cy="11" r="7" /><Path d="M20 20l-3.5-3.5" /></Icon>
);

export const ChevronLeftIcon = (p: IconProps) => <Icon {...p}><Path d="M15 5l-7 7 7 7" /></Icon>;

export const MenuIcon = (p: IconProps) => <Icon {...p}><Path d="M4 7h16M4 12h16M4 17h16" /></Icon>;

export const CloseIcon = (p: IconProps) => <Icon {...p}><Path d="M6 6l12 12M18 6L6 18" /></Icon>;

export function StarIcon({ filled, size = 16, color }: IconProps & { filled?: boolean }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? color : 'none'} stroke={color}
      strokeWidth={2} strokeLinejoin="round">
      <Path d="M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1 5.9L12 16.9l-5.2 2.8 1-5.9-4.3-4.1 5.9-.8L12 3.5z" />
    </Svg>
  );
}
