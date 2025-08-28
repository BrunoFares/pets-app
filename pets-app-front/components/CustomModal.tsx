import { colors } from "@/constants/colors";
import { BlurView } from "expo-blur";
import React, { useRef, useState } from "react";
import { Animated, Dimensions, Easing, Modal, PanResponder, Platform, StyleSheet, TouchableOpacity, View, ViewStyle, useColorScheme } from 'react-native';

interface CustomModalProps {
  children: React.ReactNode;
  style?: ViewStyle;
  visible?: boolean;
  onClose: () => void;
}

const CustomModal: React.FC<CustomModalProps> = ({
    children,
    style,
    visible,
    onClose
}) => {
    const darkMode = useColorScheme() === 'dark' 
    const styles = createStyles({ darkMode });
    const [isVisible, setIsVisible] = useState(visible);
    const slideAnim = React.useRef(new Animated.Value(1200)).current; 
    const { height: SCREEN_HEIGHT } = Dimensions.get("window");
    const panY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

    // Android fallback for BlurView
    const isAndroid = Platform.OS === 'android';
    const blurSupported = !isAndroid || (isAndroid && Number(Platform.Version) >= 31);

    React.useEffect(() => {
        if (visible) {
            // Slide in
            setIsVisible(true);
            Animated.timing(slideAnim, {
            toValue: 0,
            duration: 300,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
            }).start();
        } else {
            // Slide out
            Animated.timing(slideAnim, {
                toValue: 1200,
                duration: 300,
                easing: Easing.in(Easing.ease),
                useNativeDriver: true,
            }).start(() => {setIsVisible(false)});
        }
    }, [visible]);
    
    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onPanResponderMove: (_, gestureState) => {
                if (gestureState.dy > 0) {
                slideAnim.setValue(gestureState.dy);
                }
            },
            onPanResponderRelease: (_, gestureState) => {
                if (gestureState.dy > 100) {
                Animated.timing(slideAnim, {
                    toValue: SCREEN_HEIGHT,
                    duration: 300,
                    useNativeDriver: true,
                }).start(() => {
                    setIsVisible(false);
                    onClose();
                });
                } else {
                Animated.timing(slideAnim, {
                    toValue: 0,
                    duration: 200,
                    easing: Easing.out(Easing.ease),
                    useNativeDriver: true,
                }).start();
                }
            },
        })
    ).current;

    if (!isVisible)
        return null;

    return (
        <Modal visible={true} animationType="none" transparent={true}>
            {blurSupported ? (
                <BlurView style={styles.overlay}>
                    <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} activeOpacity={1} />
                    <Animated.View style={[styles.modalView, { transform: [{ translateY: slideAnim }] }, style]}>
                        <View style={styles.closeHandle} {...panResponder.panHandlers}/>
                        <View style={styles.centerHorizontalLine} />
                        {children}
                    </Animated.View>
                </BlurView>
            ) : (
                <View style={[styles.overlay]}> 
                    <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} activeOpacity={1} />
                    <Animated.View style={[styles.modalView, { transform: [{ translateY: slideAnim }] }, style]}>
                        <View style={styles.closeHandle} {...panResponder.panHandlers}/>
                        <View style={styles.centerHorizontalLine} />
                        {children}
                    </Animated.View>
                </View>
            )}
        </Modal>
    )
}

export default CustomModal;

export const createStyles = ({ darkMode }: any) => 
    StyleSheet.create({
        overlay: {
            flex: 1,
            justifyContent: "flex-end",
            alignItems: "center",
            backgroundColor: "rgba(0, 0, 0, 0.7)" 
        },
        modalView: {
            backgroundColor: darkMode ? colors.darkGrey : colors.white,
            borderTopRightRadius: Platform.select({
                ios: 20,
                android: 40
            }),
            borderTopLeftRadius: Platform.select({
                ios: 20,
                android: 40
            }),
            paddingTop: 10,
            paddingHorizontal: 20,
            alignItems: "center",
            shadowColor: "#000",
            shadowOffset: {
                width: 0,
                height: 2,
            },
            shadowOpacity: 0.25,
            shadowRadius: 4,
            elevation: 5,
            width: "100%",
            maxHeight: "80%",
        },
        centerHorizontalLine: {
            backgroundColor: darkMode ? colors.white : colors.lightGrey,
            height: 5,
            width: 33,
            marginBottom: 20,
            borderRadius: 10,
            alignSelf: "center",
        },
        closeHandle: {
            position: 'absolute',
            height: 80,
            width: "100%",
            zIndex: 1,
        }
    }
);