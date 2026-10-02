const MAX_SOURCE_BYTES = 10 * 1024 * 1024

export async function resizeToSquare(file: File, size = 256): Promise<Blob> {
  if (!file.type.startsWith('image/')) {
    throw new Error('Choose an image file.')
  }
  if (file.size > MAX_SOURCE_BYTES) {
    throw new Error('That image is too large. Choose one under 10 MB.')
  }

  let bitmap: ImageBitmap
  try {
    bitmap = await createImageBitmap(file)
  } catch {
    throw new Error("We couldn't read that image. Try a JPEG, PNG or WebP.")
  }

  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const context = canvas.getContext('2d')
  if (!context) {
    bitmap.close()
    throw new Error('Your browser cannot process images.')
  }

  const side = Math.min(bitmap.width, bitmap.height)
  context.fillStyle = '#ffffff'
  context.fillRect(0, 0, size, size)
  context.drawImage(
    bitmap,
    (bitmap.width - side) / 2,
    (bitmap.height - side) / 2,
    side,
    side,
    0,
    0,
    size,
    size,
  )
  bitmap.close()

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) =>
        blob ? resolve(blob) : reject(new Error('Could not process that image.')),
      'image/jpeg',
      0.9,
    )
  })
}
