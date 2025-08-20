import { FontAwesome, FontAwesome6, Foundation } from '@expo/vector-icons'

export const icons = {
    index: (props: any) => <Foundation name="home" size={24} {...props} />,
    explore: (props: any) => <FontAwesome6 name="shop" size={24} {...props} />,
    profile: (props: any) => <FontAwesome name="paw" size={24} {...props} />,
    chatbot: (props: any) => <FontAwesome name="stethoscope" size={24} {...props} />,
}