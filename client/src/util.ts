export const preloadImage = (asset: any) => {
  const img = new Image()
  img.src = asset
  return img
}