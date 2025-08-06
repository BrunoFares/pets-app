import { colors } from '@/constants/colors';
import { Text, useColorScheme } from 'react-native';

export const AdaptiveText = ({ style, otherProps, children }: any) => {
  const darkMode = useColorScheme() === 'dark';

  return <Text 
    style={[{ 
      color: darkMode ? colors.white : colors.black,
    }, style]} {...otherProps}
  >
    {children}
  </Text>
}
