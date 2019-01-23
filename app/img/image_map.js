// import React from "react";
import {
    Platform
    // TouchableOpacity
} from "react-native";

// maps screen sizes to correct images
const IMG_MAP_ANDROID = {
    ProAdv_squarish: {
        840: "ProAdv_squarish_375_375",
        720: "ProAdv_squarish_375_375",
        600: "ProAdv_squarish_375_375",
        400: "ProAdv_squarish_350_350",
        360: "ProAdv_squarish_331_331"
    },
    ProAdv_alarms_banner: {
        840: "ProAdv_alarms_banner_414_100",
        720: "ProAdv_alarms_banner_414_100",
        600: "ProAdv_alarms_banner_414_100",
        400: "ProAdv_alarms_banner_375_100",
        360: "ProAdv_alarms_banner_320_100"
    },
    ProAdv_sounds_banner: {
        840: "ProAdv_sounds_banner_414_100",
        720: "ProAdv_sounds_banner_414_100",
        600: "ProAdv_sounds_banner_414_100",
        400: "ProAdv_sounds_banner_375_100",
        360: "ProAdv_sounds_banner_320_100"
    }
};

const IMG_MAP_IOS = {
    ProAdv_squarish: {
        1024: "ProAdv_squarish_375_375",
        834: "ProAdv_squarish_375_375",
        768: "ProAdv_squarish_375_375",
        414: "ProAdv_squarish_375_375",
        // 375: "ProAdv_squarish_350_350",
        375: "ProAdv_squarish_331_331",
        320: "ProAdv_squarish_331_331"
    },
    ProAdv_alarms_banner: {
        1024: "ProAdv_alarms_banner_414_100",
        834: "ProAdv_alarms_banner_414_100",
        768: "ProAdv_alarms_banner_414_100",
        414: "ProAdv_alarms_banner_414_100",
        375: "ProAdv_alarms_banner_375_100",
        320: "ProAdv_alarms_banner_320_100"
    },
    ProAdv_sounds_banner: {
        1024: "ProAdv_sounds_banner_414_100",
        834: "ProAdv_sounds_banner_414_100",
        768: "ProAdv_sounds_banner_414_100",
        414: "ProAdv_sounds_banner_414_100",
        375: "ProAdv_sounds_banner_375_100",
        320: "ProAdv_sounds_banner_320_100"
    }
};

// NOTE: These are the upper limits of each category
let ANDROID_SCREEN_CLASSES = [840, 720, 600, 400, 360];

let IOS_SCREEN_CLASSES = [1024, 834, 768, 414, 375, 320];

function roundDownToSizeClass(width) {
    // initialize targetIdx to smallest screen size, in case width passed in is <360
    let targetIdx = ANDROID_SCREEN_CLASSES.length - 1;

    ANDROID_SCREEN_CLASSES.some((sizeClass, idx) => {
        if (width >= sizeClass) {
            targetIdx = idx;
            return true;
        }
    });

    return ANDROID_SCREEN_CLASSES[targetIdx];
}

/* Takes a base image name, screenWidth, (and optionally screen height) 
    and looks up the full name of the image to use for this screen size.
*/
let getFullImgNameForScreenSize = (imgBaseName, screenWidth) => {
    // round screenWidth down to nearest category:
    let sizeClass = screenWidth;
    let imgMap = IMG_MAP_IOS;

    if (Platform.OS == "android") {
        sizeClass = roundDownToSizeClass(screenWidth);
        imgMap = IMG_MAP_ANDROID;
    }
    // console.log("screenWidth", screenWidth);
    // console.log("sizeClass", sizeClass);

    // look up imgBaseName in IMG_MAP, then the screen size in that:
    let fullImgName = imgMap[imgBaseName] && imgMap[imgBaseName][sizeClass];
    // console.log("returning image: ", fullImgName);
    return fullImgName;
};

export default getFullImgNameForScreenSize;
