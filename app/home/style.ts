import { colors } from "@/constants/colors";
import { StyleSheet } from 'react-native';

const createStyles = ({ darkMode }: any) => {
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
      width: 170,
      height: 170,
      backgroundColor: colors.lightGrey,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
      gap: 10
    },
    gridItemText: {
      fontFamily: 'Poppins-Bold',
      fontSize: 19,
      textAlign: 'center'
    }
  })
};

export default createStyles;