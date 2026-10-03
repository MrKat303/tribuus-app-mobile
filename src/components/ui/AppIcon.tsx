import Feather from '@expo/vector-icons/Feather';
import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';
import type { ColorValue, StyleProp, TextStyle, ViewStyle } from 'react-native';

import { useThemeColors } from '@/theme/AppearanceProvider';

type FeatherName = ComponentProps<typeof Feather>['name'];
type AppIconProps = {
  color?: ColorValue;
  filled?: boolean;
  name: FeatherName;
  size?: number;
  style?: StyleProp<ViewStyle>;
};

export function AppIcon({ color, filled = false, name, size = 24, style }: AppIconProps) {
  const themeColors = useThemeColors();
  const iconColor = color ?? themeColors.text;

  if (filled && name === 'heart') return <Ionicons color={iconColor} name="heart" size={size} style={style as StyleProp<TextStyle>} />;
  return <Feather color={iconColor} name={name} size={size} style={style as StyleProp<TextStyle>} />;
}

export default AppIcon;
