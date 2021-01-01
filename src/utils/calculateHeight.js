/*
This was borrowed from https://css-tricks.com/auto-growing-inputs-textareas/
*/
export const calculateHeight = (value) => {
    let numberOfLineBreaks = (value.match(/\n/g) || []).length;


    // min-height + lines x line-height + padding + border
    let newHeight = 20 + numberOfLineBreaks * 15 + 10;
    return newHeight;
}