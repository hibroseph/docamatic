export const LightenColor = (color, luminosity) => {
  console.log("LIGHTENING COLOR")
  // validate hex string
  color = new String(color).replace(/[^0-9a-f]/gi, "");
  if (color.length < 6) {
    color = color[0] + color[0] + color[1] + color[1] + color[2] + color[2];
  }
  luminosity = luminosity || 0;

  // convert to decimal and change luminosity
  let newColor = "#",
    c,
    i,
    black = 0,
    white = 255;
  for (i = 0; i < 3; i++) {
    c = parseInt(color.substr(i * 2, 2), 16);
    c = Math.round(
      Math.min(Math.max(black, c + luminosity * white), white)
    ).toString(16);
    newColor += ("00" + c).substr(c.length);
  }

  console.log("new color is: " + newColor)
  return newColor;
};
