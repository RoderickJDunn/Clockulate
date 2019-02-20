/* NOTE: Leaving this file as a reminder that JS files can be run as scripts very easily using node cmd line. 
        Just call 'node testit.js', and the JS file will be run as a standalone script!
*/

let arr = [
    0,
    1,
    2,
    3,
    4,
    5,
    6,
    7,
    8,
    9,
    10,
    11,
    12,
    13,
    14,
    15,
    16,
    17,
    18,
    19
];

let grpIdx = arr.length - 1;

console.log("starting grpIdx", grpIdx);

console.log("Starting frame: ", arr.slice(grpIdx - 9, grpIdx + 1));
