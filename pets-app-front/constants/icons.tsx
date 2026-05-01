import {
  FontAwesome,
  FontAwesome6,
  Foundation,
  Ionicons,
  MaterialIcons,
} from "@expo/vector-icons";

export const icons = {
  index: (props: any) => <Foundation name="home" size={24} {...props} />,
  explore: (props: any) => <FontAwesome6 name="shop" size={24} {...props} />,
  messages: (props: any) => <Ionicons name="chatbubble" size={24} {...props} />,
  forum: (props: any) => <MaterialIcons name="public" size={24} {...props} />,
  profile: (props: any) => <FontAwesome name="paw" size={24} {...props} />,
};
