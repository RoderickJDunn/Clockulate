/**
 * Created by rdunn on 2017-08-23.
 */

const Colors = {
    brandSuperLightPurple: "#bcb4ca",
    brandVeryLightPurple: "#a297b5",
    brandLightPurple: "#6D6088",
    brandMidPurple: "#220957",
    brandDarkPurple: "#1f0a42",
    brandUltraDarkPurple: "#06020D",
    brandDarkBlue: "#002B6B",
    brandLightBlue: "#0052cc",
    brandVeryLightBlue: "#1a75ff",
    // brandLightOpp: "#9E804D",
    brandLightOpp: "#f5e8de",
    brandMidOpp: "#b5a89e",
    brandGreen: "#5f8669",
    brandOffWhiteBlue: "#c8d6e5",
    // brandLightGrey: "#C6C6C6",
    brandLightGrey: "#B5B5B5",
    backgroundGrey: "#E1D5CC", // previously #dbd6dd
    backgroundLightGrey: "#F1E5DC", // previous "#e0dde2"
    backgroundBright: "#fcfcfc",
    // brandDarkGrey: "#1E1E1E",
    brandDarkGrey: "#202020",
    brandMidGrey: "#232323",
    brandMidLightGrey: "#282828",
    brandMidLighterGrey: "#484848",
    buttonOnGreen: "#0dff00",
    disabledGrey: "#555555",
    labelText: "#6F6F6F",
    black: "#000",
    darkGreyText: "#292929",
    deleteBtnRed: "#ce0000",
    random: () => {
        return "#" + ((Math.random() * 0xffffff) << 0).toString(16);
    }
};

export default Colors;
