export function cloneChartSvg(svgEl: SVGSVGElement): SVGSVGElement {
  const clone = svgEl.cloneNode(true) as SVGSVGElement
  const styleBlock = document.createElement("style")
  styleBlock.textContent = `
    .stroke-border\\/40 { stroke: rgba(226, 232, 240, 0.45) !important; }
    .stroke-primary\\/50 { stroke: rgba(129, 11, 56, 0.5) !important; }
    .stroke-primary\\/60 { stroke: rgba(129, 11, 56, 0.6) !important; }
    .fill-muted-foreground { fill: #64748B !important; }
    text { font-family: 'Plus Jakarta Sans', Arial, sans-serif !important; font-weight: 600; }
  `
  clone.insertBefore(styleBlock, clone.firstChild)
  return clone
}

export function svgToCanvas(svgEl: SVGSVGElement, width = 1200, height = 520): Promise<HTMLCanvasElement> {
  return new Promise((resolve, reject) => {
    const clone = cloneChartSvg(svgEl)
    const svgString = new XMLSerializer().serializeToString(clone)
    const svgBlob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" })
    const url = window.URL || window.webkitURL || window
    const blobURL = url.createObjectURL(svgBlob)
    const image = new Image()
    image.onload = () => {
      const canvas = document.createElement("canvas")
      canvas.width = width
      canvas.height = height
      const context = canvas.getContext("2d")
      if (context) {
        context.fillStyle = "#ffffff"
        context.fillRect(0, 0, canvas.width, canvas.height)
        context.drawImage(image, 0, 0, width, height)
      }
      url.revokeObjectURL(blobURL)
      resolve(canvas)
    }
    image.onerror = reject
    image.src = blobURL
  })
}

export function downloadBlob(blob: Blob, fileName: string) {
  const link = document.createElement("a")
  link.href = URL.createObjectURL(blob)
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export function formatCurrencyExport(amount: number, locale: string): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}
