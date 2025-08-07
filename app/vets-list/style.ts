import { StyleSheet } from 'react-native';

const createStyles = ({ darkMode }: any) => {
  return StyleSheet.create({
    body: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
  })
};

export default createStyles;