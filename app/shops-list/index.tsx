import { AdaptiveText } from "@/components/AdaptiveText";
import { AdaptiveView } from "@/components/AdaptiveView";
import createStyles from "./style";

const ShopsList = () => {
    const style = createStyles({});

    return (
        <AdaptiveView style={style.body}>
            <AdaptiveText>Shops Near Me.</AdaptiveText>
        </AdaptiveView>
    )
}

export default ShopsList;