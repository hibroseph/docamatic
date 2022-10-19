const colorList = [
    "#B83737",
    "#FFDA08",
    "#FF8308",
    "#9EFF08",
    "#08FFB8",
    "#08FFFF",
    "#08B0FF",
    "#0848FF",
    "#6D08FF",
    "#C308FF",
    "#FF08F8",
    "#FF0878",
    "#FF0808"
  ];
  
  export const getRandomTagColor = () => {
    let colorIndex = Math.floor(Math.random() * (12 + 1));
  
    return colorList[colorIndex];
  }
  