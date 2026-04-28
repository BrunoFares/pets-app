import { ReactNode } from "react";
import { StyleProp, StyleSheet, View, ViewStyle } from "react-native";
import { WebView } from "react-native-webview";

function buildVideoThumbnailHtml(
  videoUrl: string,
  objectFit: "cover" | "contain",
) {
  return `<!DOCTYPE html>
<html>
  <head>
    <meta
      name="viewport"
      content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no"
    />
    <style>
      html,
      body {
        margin: 0;
        padding: 0;
        width: 100%;
        height: 100%;
        overflow: hidden;
        background: #000;
      }

      video {
        width: 100%;
        height: 100%;
        object-fit: ${objectFit};
        background: #000;
      }
    </style>
  </head>
  <body>
    <video
      id="video"
      muted
      playsinline
      webkit-playsinline
      preload="auto"
      src=${JSON.stringify(videoUrl)}
    ></video>
    <script>
      const video = document.getElementById("video");

      function clampTargetTime() {
        const duration = Number(video.duration);

        if (!Number.isFinite(duration) || duration <= 0) {
          return 0.01;
        }

        return Math.min(0.12, Math.max(duration - 0.01, 0.01));
      }

      function freezeOnFirstFrame() {
        try {
          const targetTime = clampTargetTime();

          if (Math.abs(video.currentTime - targetTime) > 0.005) {
            video.currentTime = targetTime;
          }
        } catch {}
      }

      video.addEventListener("loadedmetadata", freezeOnFirstFrame);
      video.addEventListener("loadeddata", () => {
        try {
          video.pause();
        } catch {}

        freezeOnFirstFrame();
      });
      video.addEventListener("seeked", () => {
        try {
          video.pause();
        } catch {}
      });
      video.addEventListener("play", () => {
        try {
          video.pause();
        } catch {}
      });
    </script>
  </body>
</html>`;
}

export function VideoThumbnail({
  uri,
  style,
  resizeMode = "cover",
  overlay,
}: {
  uri: string;
  style?: StyleProp<ViewStyle>;
  resizeMode?: "cover" | "contain";
  overlay?: ReactNode;
}) {
  return (
    <View style={[styles.container, style]}>
      <WebView
        originWhitelist={["*"]}
        source={{ html: buildVideoThumbnailHtml(uri, resizeMode) }}
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
        mixedContentMode="always"
        scrollEnabled={false}
        bounces={false}
        pointerEvents="none"
        style={styles.webView}
      />
      {overlay ? (
        <View pointerEvents="none" style={styles.overlay}>
          {overlay}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: "hidden",
    backgroundColor: "#000",
  },
  webView: {
    flex: 1,
    backgroundColor: "#000",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
});
