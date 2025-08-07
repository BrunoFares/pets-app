import { AdaptiveText } from "@/components/AdaptiveText";
import { AdaptiveView } from "@/components/AdaptiveView";
import createStyles from "./style";

const VetsList = () => {
    const style = createStyles({});

    return (
        <AdaptiveView style={style.body}>
            <AdaptiveText>Vets Near Me.</AdaptiveText>
        </AdaptiveView>
    )
}

export default VetsList;