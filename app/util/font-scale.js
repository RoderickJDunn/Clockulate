import { Dimensions, Platform, PixelRatio } from "react-native";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

// based on iphone 5s's scale
const SCALE = SCREEN_WIDTH / 320;

export function scale(size) {
    console.log("Normalizing... ");
    console.log("size: " + size);
    console.log("SCREEN_WIDTH", SCREEN_WIDTH);
    console.log("scale", SCALE);

    if (Platform.OS === "ios") {
        let ret = Math.round(
            // PixelRatio.roundToNearestPixel(size) * (SCALE / bluntFactor)
            size * SCALE
        );
        console.log("ret", ret);
        return ret;
    } else {
        let ret = Math.round(size * SCALE) - 2;
        console.log("ret", ret);
        return ret;
    }
}

export function scaleByFactor(size, bluntFactor = 1) {
    bluntFactor = bluntFactor > 0 ? bluntFactor : 1;
    if (Platform.OS === "ios") {
        return Math.round(
            // PixelRatio.roundToNearestPixel(size) * (scale / bluntFactor)
            size + (scale(size) - size) * bluntFactor
        );
    } else {
        // scale * bluntfactor does not work, it seems.
        // I need to find a way to make the bluntFactor bring the (scale) term closer to 1
        return Math.round(size + (scale(size) - size) * bluntFactor) - 2;
    }
}
