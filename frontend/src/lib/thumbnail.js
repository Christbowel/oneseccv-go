/**
 * Shrinks the first preview page into a tiny PNG used as the history
 * thumbnail. Drive holds the CV source anyway; the point is to keep the
 * index light enough to load instantly on mobile data.
 */
export function makeThumbnail(pageBase64, width = 150) {
  return new Promise(resolve => {
    if (!pageBase64) return resolve('')

    const img = new Image()
    img.onload = () => {
      try {
        const scale = width / img.width
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = Math.round(img.height * scale)
        const ctx = canvas.getContext('2d')
        ctx.imageSmoothingQuality = 'high'
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        resolve(canvas.toDataURL('image/png').split(',')[1] || '')
      } catch {
        resolve('') // a missing thumbnail must never block saving the CV
      }
    }
    img.onerror = () => resolve('')
    img.src = `data:image/png;base64,${pageBase64}`
  })
}
