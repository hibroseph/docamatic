function hex_to_RGB(hex) {
  console.log("hex: " + hex);
  var m = hex.match(/^#?([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i);
  return {
    r: parseInt(m[1], 16),
    g: parseInt(m[2], 16),
    b: parseInt(m[3], 16)
  };
}

export const getContrastingColor = col => {
  console.log("contrastingcolor:");
  console.log(col);
  if (col === "transparent") {
    return "rgba(0,0,0,0.4)";
  }

  let color = hex_to_RGB(col);

  const yiq = (color.r * 299 + color.g * 587 + color.b * 114) / 1000;
  return yiq >= 128 ? "#000" : "#fff";
};
