/**
 * Created by rdunn on 2017-08-23.
 */

const Colors = {
    brandLightPurple: "#6D6088",
    brandDarkPurple: "#220957",
    brandLightGrey: "#C6C6C6",
    backgroundGrey: "#dbd6dd", // previously #e8e8e8
    brandDarkGrey: "#1E1E1E",
    buttonOnGreen: "#0dff00",
    disabledGrey: "#999999",
    black: "#000",
    deleteBtnRed: "#ce0000"
};

export const randomColor = () => {
    return "#" + ((Math.random() * 0xffffff) << 0).toString(16);
};

export default Colors;
