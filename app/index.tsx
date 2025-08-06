import { AdaptiveText } from "@/components/AdaptiveText";
import { AdaptiveView } from "@/components/AdaptiveView";

export default function HomeScreen() {
  return (
    <AdaptiveView
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <AdaptiveText>Paris Saint Gay Men</AdaptiveText>
    </AdaptiveView>
  );
}
