import { FontAwesome, FontAwesome6, Foundation, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'

export const icons = {
    index: (props: any) => <Foundation name="home" size={24} {...props} />,
    explore: (props: any) => <FontAwesome6 name="shop" size={24} {...props} />,
    chatbot: (props: any) => <MaterialCommunityIcons name="stethoscope" size={24} {...props} />,
    forum: (props: any) => <Ionicons name="chatbubble-ellipses-sharp" size={24} {...props} />,
    profile: (props: any) => <FontAwesome name="paw" size={24} {...props} />,
}