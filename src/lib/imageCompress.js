// Compress + resize an image entirely in the browser using Canvas.
// No npm dependency required. Returns a Blob ready to upload to Supabase Storage.
//
// - Scales the longest edge down to maxDim (default 1600px)
// - Re-encodes as JPEG at the given quality (default 0.8)
// - Leaves small images essentially untouched (still re-encoded, but no upscaling)
export async function compressImage(file, { maxDim = 1600, quality = 0.8 } = {}) {
  // Only process raster images; if something odd comes in, return original.
  if (!file || !file.type?.startsWith('image/')) return file

  const dataUrl = await new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })

  const img = await new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = reject
    image.src = dataUrl
  })

  let { width, height } = img
  if (width > maxDim || height > maxDim) {
    if (width >= height) {
      height = Math.round(height * (maxDim / width))
      width = maxDim
    } else {
      width = Math.round(width * (maxDim / height))
      height = maxDim
    }
  }

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  ctx.drawImage(img, 0, 0, width, height)

  const blob = await new Promise((resolve) => {
    canvas.toBlob(
      (b) => resolve(b),
      'image/jpeg',
      quality
    )
  })

  // Fallback: if canvas failed for any reason, upload the original.
  return blob || file
}
