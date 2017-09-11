/**
 * Created by rdunn on 2017-08-23.
 */


const Colors = {
    brandLightPurple: "#6D6088",
    brandDarkPurple: "#220957",
    brandPalePurple: "rgba(73, 91, 0.44)",
    brandLightGrey: "#C6C6C6",
    brandDarkGrey: "#1E1E1E",

};

export const randomColor = () => {
    return '#' + (Math.random() * 0xFFFFFF << 0).toString(16);
};

export default Colors;
