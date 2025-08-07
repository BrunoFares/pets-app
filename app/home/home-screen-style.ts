import { colors } from "@/constants/colors";
import { StyleSheet } from 'react-native';

export const createStyles = ({ colorScheme }: any) => {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.green,
    },
    body: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    quadrant: {
      gap: 10
    },
    row: {
      flexDirection: 'row',
      gap: 10
    },
    gridItem: {
      width: 150,
      height: 150,
      backgroundColor: colors.lightGrey,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center'
    }
  })
};