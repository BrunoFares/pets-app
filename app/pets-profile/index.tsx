import { AdaptiveText } from "@/components/AdaptiveText";
import { AdaptiveView } from "@/components/AdaptiveView";
import createStyles from "./style";

const PetsProfile = () => {
    const style = createStyles({});

    return (
        <AdaptiveView style={style.body}>
            <AdaptiveText>My Pets.</AdaptiveText>
        </AdaptiveView>
    )
}

export default PetsProfile;