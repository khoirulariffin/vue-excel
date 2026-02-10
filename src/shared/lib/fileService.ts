import type { SheetData } from '@/shared/types'

export const saveProjectFile = (data: SheetData[], filename: string) => {
  const jsonString = JSON.stringify(data, null, 2)
  const blob = new Blob([jsonString], { type: 'application/json' })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.download = `${filename.replace(/\.[^/.]+$/, '')}_master_data.json`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export const loadProjectFile = (file: File): Promise<SheetData[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string
        const data = JSON.parse(text)

        if (Array.isArray(data)) {
          resolve(data as SheetData[])
        } else if (data.rows && data.columns) {
          resolve([data] as SheetData[])
        } else {
          throw new Error('Invalid Master Data file')
        }
      } catch (error) {
        reject(error)
      }
    }
    reader.onerror = reject
    reader.readAsText(file)
  })
}
