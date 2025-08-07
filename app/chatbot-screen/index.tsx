import { AdaptiveText } from "@/components/AdaptiveText";
import { AdaptiveView } from "@/components/AdaptiveView";
import createStyles from "./style";

const ChatbotScreen = () => {
    const style = createStyles({});

    return (
        <AdaptiveView style={style.body}>
            <AdaptiveText>Dr. PetsApp.</AdaptiveText>
        </AdaptiveView>
    )
}

export default ChatbotScreen;