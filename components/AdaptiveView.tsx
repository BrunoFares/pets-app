import { colors } from '@/constants/colors';
import { useColorScheme, View } from 'react-native';

export const AdaptiveView = ({ style, otherProps, children }: any) => {
  const darkMode = useColorScheme() === 'dark';

  return <View 
    style={[{ 
      backgroundColor: darkMode ? colors.darkGreen : colors.lightLightGreen2,
    }, style]} {...otherProps}
  >
    {children}
  </View>;
}
