// Messages to appear when a note is created
const colorList = [
  "#0082C8",
  "#FFD03E",
  "#b3fedf",
  "#5a3791",
  "#2daa4b",
  "#5bc0de",
  "#eac0c8",
  "#008080"
];

function getRandomColor() {
  let colorIndex = Math.floor(Math.random() * (7 + 1));

  return colorList[colorIndex];
}

export default getRandomColor;
