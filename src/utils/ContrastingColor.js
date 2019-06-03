export const getContrastingColor = (col) => {
  if (col.hex === 'transparent') {
    return 'rgba(0,0,0,0.4)'
  }
  const yiq = ((col.rgb.r * 299) + (col.rgb.g * 587) + (col.rgb.b * 114)) / 1000
  return (yiq >= 128) ? '#000' : '#fff'
}