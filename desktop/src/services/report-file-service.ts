/** Hands a downloaded file to the browser's save flow (Electron asks where to save it). */
export function saveFile(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  link.remove()
  // Revoke after the download has picked the URL up.
  setTimeout(() => URL.revokeObjectURL(url), 60_000)
}
