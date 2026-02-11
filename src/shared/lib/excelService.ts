/* eslint-disable @typescript-eslint/no-explicit-any */
import ExcelJS from 'exceljs'
import JSZip from 'jszip'
import type {
  SheetData,
  ColumnMetadata,
  CellData,
  CellStyle,
  InputConfig,
  InputType,
  ExcelShape,
  RowMetadata,
  MergeRange,
} from '@/shared/types'
import { UserRole } from '@/shared/types'

const EMU_PER_PIXEL = 9525

// --- COLOR UTILITIES ---
const INDEXED_COLORS = [
  '#000000',
  '#FFFFFF',
  '#FF0000',
  '#00FF00',
  '#0000FF',
  '#FFFF00',
  '#FF00FF',
  '#00FFFF',
  '#000000',
  '#FFFFFF',
  '#FF0000',
  '#00FF00',
  '#0000FF',
  '#FFFF00',
  '#FF00FF',
  '#00FFFF',
  '#800000',
  '#008000',
  '#000080',
  '#808000',
  '#808000',
  '#008080',
  '#C0C0C0',
  '#808080',
  '#9999FF',
  '#993366',
  '#FFFFCC',
  '#CCFFFF',
  '#660066',
  '#FF8080',
  '#0066CC',
  '#CCCCFF',
  '#000080',
  '#FF00FF',
  '#FFFF00',
  '#00FFFF',
  '#800080',
  '#800000',
  '#008080',
  '#0000FF',
  '#00CCFF',
  '#CCFFFF',
  '#CCFFCC',
  '#FFFF99',
  '#99CCFF',
  '#FF99CC',
  '#CC99FF',
  '#FFCC99',
  '#3366FF',
  '#33CCCC',
  '#99CC00',
  '#FFCC00',
  '#FF9900',
  '#FF6600',
  '#666699',
  '#969696',
  '#003366',
  '#339966',
  '#003300',
  '#333300',
  '#993300',
  '#993366',
  '#333399',
  '#333333',
]

const THEME_COLORS = [
  '#FFFFFF',
  '#000000',
  '#E7E6E6',
  '#44546A',
  '#4472C4',
  '#ED7D31',
  '#A5A5A5',
  '#FFC000',
  '#5B9BD5',
  '#70AD47',
  '#0000FF',
  '#800080',
]

const hexToRgb = (hex: string) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? {
        r: parseInt(result[1]!, 16),
        g: parseInt(result[2]!, 16),
        b: parseInt(result[3]!, 16),
      }
    : { r: 0, g: 0, b: 0 }
}

const rgbToHex = (r: number, g: number, b: number) => {
  return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase()
}

const applyTint = (hex: string, tint: number) => {
  if (!tint || tint === 0) return hex
  const rgb = hexToRgb(hex)
  let r = rgb.r,
    g = rgb.g,
    b = rgb.b

  if (tint > 0) {
    r = r + (255 - r) * tint
    g = g + (255 - g) * tint
    b = b + (255 - b) * tint
  } else {
    r = r * (1 + tint)
    g = g * (1 + tint)
    b = b * (1 + tint)
  }

  return rgbToHex(Math.round(r), Math.round(g), Math.round(b))
}

const applyLumModOff = (hex: string, lumMod?: number, lumOff?: number) => {
  if (lumMod === undefined && lumOff === undefined) return hex

  const rgb = hexToRgb(hex)
  const mod = lumMod !== undefined ? lumMod / 100000 : 1
  const off = lumOff !== undefined ? lumOff / 100000 : 0

  let r = rgb.r / 255
  let g = rgb.g / 255
  let b = rgb.b / 255

  r = r * mod + off
  g = g * mod + off
  b = b * mod + off

  r = Math.min(1, Math.max(0, r))
  g = Math.min(1, Math.max(0, g))
  b = Math.min(1, Math.max(0, b))

  return rgbToHex(Math.round(r * 255), Math.round(g * 255), Math.round(b * 255))
}

const resolveExcelColor = (colorVal?: any): string | undefined => {
  if (!colorVal) return undefined
  if (colorVal.argb) {
    if (colorVal.argb.length === 8) {
      return '#' + colorVal.argb.substring(2)
    }
    return '#' + colorVal.argb
  }
  if (colorVal.theme !== undefined) {
    const themeColor = THEME_COLORS[colorVal.theme]
    if (themeColor) {
      if (colorVal.tint) {
        return applyTint(themeColor, colorVal.tint)
      }
      return themeColor
    }
  }
  if (colorVal.indexed !== undefined) {
    return INDEXED_COLORS[colorVal.indexed] || undefined
  }
  return undefined
}

export const getColumnLabel = (index: number): string => {
  let label = ''
  let i = index
  while (i >= 0) {
    label = String.fromCharCode((i % 26) + 65) + label
    i = Math.floor(i / 26) - 1
  }
  return label
}

const bufferToBase64 = (buffer: ArrayBuffer): string => {
  let binary = ''
  const bytes = new Uint8Array(buffer)
  const len = bytes.byteLength
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]!)
  }
  return btoa(binary)
}

const formatCellValue = (value: any): string => {
  if (value === null || value === undefined) return ''
  if (value instanceof Date || (value && value.constructor && value.constructor.name === 'Date')) {
    const d = new Date(value)
    if (!isNaN(d.getTime())) {
      const months = [
        'Jan',
        'Feb',
        'Mar',
        'Apr',
        'May',
        'Jun',
        'Jul',
        'Aug',
        'Sep',
        'Oct',
        'Nov',
        'Dec',
      ]
      return `${d.getDate().toString().padStart(2, '0')}-${months[d.getMonth()]}-${d.getFullYear().toString().slice(-2)}`
    }
  }
  if (typeof value === 'object') {
    if (value.richText && Array.isArray(value.richText)) {
      return value.richText.map((rt: any) => rt.text).join('')
    }
    if (value.result !== undefined) {
      return formatCellValue(value.result)
    }
    if (value.text !== undefined) return value.text
  }
  return String(value)
}

const findMedia = (workbook: any, imageId: string) => {
  const model = workbook.model
  const mediaList = model?.media || workbook.media || []
  if (!mediaList || mediaList.length === 0) return null
  const m = mediaList.find((item: any) => String(item.index) === String(imageId))
  if (m) return m
  const numId = parseInt(imageId, 10)
  if (!isNaN(numId) && mediaList[numId]) return mediaList[numId]
  return null
}

const parseSpecialSyntax = (
  text: string,
): { value: string | null; config: InputConfig | undefined } => {
  const regex = /^\{(\w+)\s+([a-zA-Z0-9_]+)\s*(?:=\s*(.*?))?\s*(?:#\s*(.*))?\}$/
  const match = text.trim().match(regex)
  if (!match) return { value: text, config: undefined }

  const typeCode = match[1]!.toLowerCase()
  const label = match[2]
  const defaultValueRaw = match[3] || ''
  const placeholder = match[4] || ''

  let type: InputType = 'text'
  let options: string[] = []
  let displayValue: string | null = null

  switch (typeCode) {
    case 'str':
      type = 'text'
      displayValue = defaultValueRaw
      break
    case 'int':
    case 'float':
      type = 'number'
      displayValue = defaultValueRaw
      break
    case 'bool':
      type = 'boolean'
      displayValue = defaultValueRaw
      break
    case 'list': {
      type = 'select'
      const arrayMatch = defaultValueRaw.match(/^\[(.*)\]$/)
      if (arrayMatch) {
        options = arrayMatch[1]!.split(',').map((s) => s.trim())
        displayValue = options[0] || ''
      }
      break
    }
    case 'img':
      type = 'image'
      displayValue = null
      break
    case 'cam':
      type = 'image'
      displayValue = null
      break
    case 'sign':
      type = 'image'
      displayValue = null
      break
    default:
      return { value: text, config: undefined }
  }

  return {
    value: displayValue,
    config: {
      type,
      label,
      placeholder,
      options: options.length > 0 ? options : undefined,
      required: true,
    },
  }
}

const mapBorderToString = (border: any): string | undefined => {
  if (!border || !border.style || border.style === 'none') return undefined
  const color = resolveExcelColor(border.color) || '#000000'
  let width = 1
  if (border.style === 'thick') width = 3
  if (border.style === 'medium') width = 2
  return `${width}px ${border.style} ${color}`
}

// --- DOM HELPERS ---
const getChildTag = (parent: Element, tagName: string): Element | undefined => {
  for (let i = 0; i < parent.childNodes.length; i++) {
    const node = parent.childNodes[i] as Element
    if (node.nodeType === 1 && (node.localName === tagName || node.tagName === tagName)) {
      return node
    }
  }
  return undefined
}

const getChildrenByTag = (parent: Element, tagName: string): Element[] => {
  const res: Element[] = []
  for (let i = 0; i < parent.childNodes.length; i++) {
    const node = parent.childNodes[i] as Element
    if (node.nodeType === 1 && (node.localName === tagName || node.tagName === tagName)) {
      res.push(node)
    }
  }
  return res
}

const getAttr = (el: Element | undefined, attr: string): string | null => {
  return el?.getAttribute(attr) || null
}

const parseColor = (el: Element | undefined): string | undefined => {
  if (!el) return undefined
  let baseColor: string | undefined = undefined
  let lumMod: number | undefined = undefined
  let lumOff: number | undefined = undefined

  const srgb = getChildTag(el, 'srgbClr')
  if (srgb) {
    baseColor = '#' + getAttr(srgb, 'val')
    const lm = getChildTag(srgb, 'lumMod')
    const lo = getChildTag(srgb, 'lumOff')
    if (lm) lumMod = parseInt(getAttr(lm, 'val') || '100000')
    if (lo) lumOff = parseInt(getAttr(lo, 'val') || '0')
  }

  const scheme = getChildTag(el, 'schemeClr')
  if (scheme) {
    const val = getAttr(scheme, 'val')
    if (val === 'tx1') baseColor = '#000000'
    else if (val === 'bg1') baseColor = '#FFFFFF'
    else if (val === 'accent1') baseColor = '#4472C4'
    else if (val === 'accent2') baseColor = '#ED7D31'
    else if (val === 'accent3') baseColor = '#A5A5A5'
    else if (val === 'accent4') baseColor = '#FFC000'
    else if (val === 'accent5') baseColor = '#5B9BD5'
    else if (val === 'accent6') baseColor = '#70AD47'
    else baseColor = '#808080'

    const lm = getChildTag(scheme, 'lumMod')
    const lo = getChildTag(scheme, 'lumOff')
    if (lm) lumMod = parseInt(getAttr(lm, 'val') || '100000')
    if (lo) lumOff = parseInt(getAttr(lo, 'val') || '0')
  }

  const prst = getChildTag(el, 'prstClr')
  if (prst) {
    const val = getAttr(prst, 'val')
    if (val === 'black') baseColor = '#000000'
    else if (val === 'white') baseColor = '#FFFFFF'
    else baseColor = val || undefined
  }

  if (baseColor) {
    return applyLumModOff(baseColor, lumMod, lumOff)
  }
  return undefined
}

// Robust mapping of Sheet Name -> File Name
const mapSheetNamesToFiles = async (zip: JSZip): Promise<Record<string, string>> => {
  const nameToFile: Record<string, string> = {}
  try {
    const wbXml = await zip.file('xl/workbook.xml')?.async('text')
    if (!wbXml) return {}
    const wbDoc = new DOMParser().parseFromString(wbXml, 'text/xml')
    const sheets = wbDoc.getElementsByTagName('sheet')

    const ridToName: Record<string, string> = {}
    for (let i = 0; i < sheets.length; i++) {
      const s = sheets[i]
      const name = s?.getAttribute('name')
      const rid = s?.getAttribute('r:id')
      if (name && rid) ridToName[rid] = name
    }

    const relsXml = await zip.file('xl/_rels/workbook.xml.rels')?.async('text')
    if (!relsXml) return {}
    const relsDoc = new DOMParser().parseFromString(relsXml, 'text/xml')
    const rels = relsDoc.getElementsByTagName('Relationship')

    for (let i = 0; i < rels.length; i++) {
      const r = rels[i]
      const id = r?.getAttribute('Id')
      const target = r?.getAttribute('Target')
      if (id && target && ridToName[id]) {
        const filename = target.split('/').pop()
        if (filename) {
          nameToFile[ridToName[id]] = filename
        }
      }
    }
  } catch (e) {
    console.warn('Failed to map sheets', e)
  }
  return nameToFile
}

const parseDrawingXml = async (
  zip: JSZip,
  sheetFilename: string,
  columns: ColumnMetadata[],
  rowMetadata: { [key: number]: RowMetadata },
): Promise<ExcelShape[]> => {
  try {
    const relsPath = `xl/worksheets/_rels/${sheetFilename}.rels`
    const relsFile = zip.file(relsPath)
    if (!relsFile) return []

    const relsXml = await relsFile.async('text')
    const parser = new DOMParser()
    const relsDoc = parser.parseFromString(relsXml, 'text/xml')

    const drawingRel = Array.from(relsDoc.getElementsByTagName('Relationship')).find((el) =>
      el.getAttribute('Type')?.endsWith('drawing'),
    )

    if (!drawingRel) return []

    let target = drawingRel.getAttribute('Target')
    if (!target) return []

    if (target.startsWith('../')) target = target.replace('../', 'xl/')
    else if (!target.startsWith('xl/')) target = 'xl/worksheets/' + target

    const filename = target.split('/').pop()
    const drawingPath = Object.keys(zip.files).find((path) => path.endsWith(`drawings/${filename}`))

    if (!drawingPath) return []

    const drawingFile = zip.file(drawingPath)
    if (!drawingFile) return []

    const drawingXml = await drawingFile.async('text')
    const drawingDoc = parser.parseFromString(drawingXml, 'text/xml')

    const shapes: ExcelShape[] = []

    const calculatePos = (col: number, colOff: number, row: number, rowOff: number) => {
      let x = 0
      for (let c = 0; c < col; c++) x += columns[c]?.width || 80
      x += colOff / EMU_PER_PIXEL

      let y = 0
      for (let r = 0; r < row; r++) {
        y += rowMetadata[r]?.height || 24
      }
      y += rowOff / EMU_PER_PIXEL
      return { x, y }
    }

    const getText = (parent: Element, tag: string) => {
      const child = getChildTag(parent, tag)
      return child?.textContent || '0'
    }

    const extractShapeData = (
      node: Element,
      x: number,
      y: number,
      w: number,
      h: number,
      _isGroup: boolean,
      _groupTransform?: any,
    ): ExcelShape | null => {
      const localName = node.localName
      const isGrp = localName === 'grpSp'

      if (isGrp) {
        const grpSpPr = getChildTag(node, 'grpSpPr')
        if (grpSpPr) {
          const xfrm = getChildTag(grpSpPr, 'xfrm')
          const chOff = getChildTag(xfrm!, 'chOff')
          const chExt = getChildTag(xfrm!, 'chExt')
          const chOffX = parseInt(getAttr(chOff, 'x') || '0')
          const chOffY = parseInt(getAttr(chOff, 'y') || '0')
          const chExtW = parseInt(getAttr(chExt, 'cx') || '1')
          const chExtH = parseInt(getAttr(chExt, 'cy') || '1')

          const newGroupTransform = { x, y, w, h, chOffX, chOffY, chExtW, chExtH }

          for (let i = 0; i < node.childNodes.length; i++) {
            const child = node.childNodes[i] as Element
            if (child.nodeType !== 1) continue
            const t = child.localName
            if (t === 'sp' || t === 'cxnSp' || t === 'grpSp') {
              let cx = 0,
                cy = 0,
                cw = 0,
                ch = 0
              const spPr = getChildTag(child, isGrp && t === 'grpSp' ? 'grpSpPr' : 'spPr')

              if (spPr) {
                const xfrm2 = getChildTag(spPr, 'xfrm')
                const off = getChildTag(xfrm2!, 'off')
                const ext = getChildTag(xfrm2!, 'ext')

                const offX = parseInt(getAttr(off, 'x') || '0')
                const offY = parseInt(getAttr(off, 'y') || '0')
                const extW = parseInt(getAttr(ext, 'cx') || '0')
                const extH = parseInt(getAttr(ext, 'cy') || '0')

                const scaleX = newGroupTransform.w / newGroupTransform.chExtW
                const scaleY = newGroupTransform.h / newGroupTransform.chExtH

                cx = newGroupTransform.x + (offX - newGroupTransform.chOffX) * scaleX
                cy = newGroupTransform.y + (offY - newGroupTransform.chOffY) * scaleY
                cw = extW * scaleX
                ch = extH * scaleY

                const childShape = extractShapeData(
                  child,
                  cx,
                  cy,
                  cw,
                  ch,
                  t === 'grpSp',
                  newGroupTransform,
                )
                if (childShape) shapes.push(childShape)
              }
            }
          }
        }
        return null
      }

      const spPr = getChildTag(node, 'spPr')
      const styleNode = getChildTag(node, 'style')

      const prstGeom = getChildTag(spPr!, 'prstGeom')
      let shapeType = getAttr(prstGeom, 'prst')
      if (!shapeType && localName === 'cxnSp') shapeType = 'line'
      if (!shapeType) shapeType = 'rect'

      let fill: string | undefined = undefined
      if (spPr) {
        const solidFill = getChildTag(spPr, 'solidFill')
        if (solidFill) fill = parseColor(solidFill)
        else if (getChildTag(spPr, 'noFill')) fill = 'transparent'
      }

      if (!fill && styleNode) {
        const fillRef = getChildTag(styleNode, 'fillRef')
        if (fillRef) fill = parseColor(fillRef)
      }

      let stroke: string | undefined = undefined
      let strokeWidth = 1
      let strokeDash: string | undefined = undefined
      const ln = getChildTag(spPr!, 'ln')
      if (ln) {
        const lnFill = getChildTag(ln, 'solidFill')
        stroke = parseColor(lnFill) || '#000000'
        const wAttr = getAttr(ln, 'w')
        if (wAttr) strokeWidth = parseInt(wAttr) / 12700
        const prstDash = getChildTag(ln, 'prstDash')
        if (prstDash) strokeDash = getAttr(prstDash, 'val') || undefined
        if (getChildTag(ln, 'noFill')) stroke = 'transparent'
      } else if (styleNode) {
        const lnRef = getChildTag(styleNode, 'lnRef')
        if (lnRef) stroke = parseColor(lnRef)
      }

      let text: string | undefined = undefined
      let textColor: string | undefined = undefined
      let textSize = 11
      let textBold = false
      let textAlign: 'left' | 'center' | 'right' = 'center'
      let textVertical: 'top' | 'center' | 'bottom' = 'center'

      const txBody = getChildTag(node, 'txBody')
      if (txBody) {
        const bodyPr = getChildTag(txBody, 'bodyPr')
        if (bodyPr) {
          const anchor = getAttr(bodyPr, 'anchor')
          if (anchor === 't') textVertical = 'top'
          else if (anchor === 'b') textVertical = 'bottom'
          else textVertical = 'center'
        }

        const ps = getChildrenByTag(txBody, 'p')
        let fullText = ''
        if (ps.length > 0) {
          const pPr = getChildTag(ps[0]!, 'pPr')
          const algn = getAttr(pPr, 'algn')
          if (algn === 'l') textAlign = 'left'
          else if (algn === 'r') textAlign = 'right'
          else textAlign = 'center'
        }

        ps.forEach((p) => {
          const runs = getChildrenByTag(p, 'r')
          runs.forEach((r) => {
            const t = getChildTag(r, 't')?.textContent || ''
            fullText += t
            if (!textColor) {
              const rPr = getChildTag(r, 'rPr')
              if (rPr) {
                const solidFill = getChildTag(rPr, 'solidFill')
                textColor = parseColor(solidFill)
                const sz = getAttr(rPr, 'sz')
                if (sz) textSize = parseInt(sz) / 100
                if (getAttr(rPr, 'b') === '1') textBold = true
              }
            }
          })
          if (ps.length > 1) fullText += '\n'
        })
        text = fullText.trim()
      }

      if (text && !fill && (shapeType === 'rect' || shapeType === 'textBox')) {
        fill = '#FFFFFF'
      }

      const xfrm3 = getChildTag(spPr!, 'xfrm')
      const flipH = getAttr(xfrm3, 'flipH') === '1'
      const flipV = getAttr(xfrm3, 'flipV') === '1'

      return {
        id: `shp_${Math.random().toString(36).substr(2, 9)}`,
        type: 'form',
        shapeType,
        fill,
        stroke,
        strokeWidth,
        strokeDash,
        text,
        textColor,
        textSize,
        textBold,
        textAlign,
        textVertical,
        flipH,
        flipV,
        x: Math.round(x),
        y: Math.round(y),
        w: Math.round(w),
        h: Math.round(h),
        from: { col: 0, row: 0, colOff: 0, rowOff: 0 },
        to: { col: 0, row: 0, colOff: 0, rowOff: 0 },
      } as ExcelShape
    }

    const root = drawingDoc.documentElement
    if (root) {
      for (let i = 0; i < root.childNodes.length; i++) {
        const node = root.childNodes[i] as Element
        if (node.nodeType !== 1) continue
        const tagName = node.localName
        if (tagName === 'twoCellAnchor' || tagName === 'oneCellAnchor') {
          let x = 0,
            y = 0,
            w = 0,
            h = 0
          const from = getChildTag(node, 'from')
          if (from) {
            const fCol = parseInt(getText(from, 'col'))
            const fColOff = parseInt(getText(from, 'colOff'))
            const fRow = parseInt(getText(from, 'row'))
            const fRowOff = parseInt(getText(from, 'rowOff'))
            const start = calculatePos(fCol, fColOff, fRow, fRowOff)
            x = start.x
            y = start.y
          }

          if (tagName === 'twoCellAnchor') {
            const to = getChildTag(node, 'to')
            if (to) {
              const tCol = parseInt(getText(to, 'col'))
              const tColOff = parseInt(getText(to, 'colOff'))
              const tRow = parseInt(getText(to, 'row'))
              const tRowOff = parseInt(getText(to, 'rowOff'))
              const end = calculatePos(tCol, tColOff, tRow, tRowOff)
              const startX = x
              const startY = y
              const endX = end.x
              const endY = end.y
              x = Math.min(startX, endX)
              y = Math.min(startY, endY)
              w = Math.abs(endX - startX)
              h = Math.abs(endY - startY)
            }
          } else {
            const ext = getChildTag(node, 'ext')
            const cx = parseInt(getAttr(ext, 'cx') || '0')
            const cy = parseInt(getAttr(ext, 'cy') || '0')
            w = cx / EMU_PER_PIXEL
            h = cy / EMU_PER_PIXEL
          }

          let contentNode = getChildTag(node, 'sp')
          if (!contentNode) contentNode = getChildTag(node, 'cxnSp')
          if (!contentNode) contentNode = getChildTag(node, 'grpSp')

          if (contentNode) {
            const result = extractShapeData(
              contentNode,
              x,
              y,
              w,
              h,
              contentNode.localName === 'grpSp',
            )
            if (result) shapes.push(result)
          }
        }
      }
    }
    return shapes
  } catch (e) {
    console.warn('Failed to parse drawing XML', e)
    return []
  }
}

export const generateEmptySheet = (name: string): SheetData => {
  const columns: ColumnMetadata[] = []
  for (let i = 0; i < 26; i++) {
    columns.push({
      id: i,
      width: 85,
      header: getColumnLabel(i),
      permissions: [UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF],
    })
  }

  return {
    name,
    rows: {},
    rowMetadata: {},
    rowCount: 100,
    colCount: 26,
    columns,
    merges: [],
    shapes: [],
  }
}

export const parseExcelFile = async (file: File): Promise<SheetData[]> => {
  const buffer = await file.arrayBuffer()
  const zip = await JSZip.loadAsync(buffer)

  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.load(buffer)

  const sheetMap = await mapSheetNamesToFiles(zip)
  const sheets: SheetData[] = []

  for (const worksheet of workbook.worksheets) {
    const rowCount = worksheet.rowCount
    let maxColIdx = 0
    worksheet.eachRow((row) => {
      row.eachCell((_cell, colNumber) => {
        if (colNumber > maxColIdx) maxColIdx = colNumber
      })
    })
    const colCount = Math.max(worksheet.columnCount, maxColIdx)

    // --- COLUMN WIDTH CALCULATION ---
    const columns: ColumnMetadata[] = []
    const defaultWidth = worksheet.properties.defaultColWidth || 8.43

    for (let c = 1; c <= colCount; c++) {
      const colObj = worksheet.getColumn(c)
      let excelWidth = colObj.width
      if (excelWidth === undefined) {
        excelWidth = defaultWidth
      }
      const pixelWidth = Math.max(Math.round(excelWidth * 7.2), 25)

      columns.push({
        id: c - 1,
        width: pixelWidth,
        header: getColumnLabel(c - 1),
        permissions: [UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF],
      })
    }

    // Padding
    if (columns.length < 10) {
      const padWidth = Math.round(defaultWidth * 7.2)
      for (let i = columns.length; i < 10; i++) {
        columns.push({
          id: i,
          width: padWidth,
          header: getColumnLabel(i),
          permissions: [UserRole.ADMIN],
        })
      }
    }

    const merges: MergeRange[] = []
    if ((worksheet.model as any).merges) {
      ;(worksheet.model as any).merges.forEach((rangeStr: string) => {
        const [start, end] = rangeStr.split(':')
        const parseAddress = (addr: string) => {
          const match = addr.match(/([A-Z]+)([0-9]+)/)
          if (!match) return { r: 0, c: 0 }
          const colStr = match[1]!
          const rowStr = match[2]
          let col = 0
          for (let i = 0; i < colStr.length; i++) {
            col = col * 26 + (colStr.charCodeAt(i) - 64)
          }
          return { r: parseInt(rowStr!) - 1, c: col - 1 }
        }
        if (start && end) merges.push({ s: parseAddress(start), e: parseAddress(end) })
      })
    }

    const rows: { [key: number]: { [key: number]: CellData } } = {}
    const rowMetadata: { [key: number]: RowMetadata } = {}

    worksheet.eachRow({ includeEmpty: true }, (row, rowNumber) => {
      const rowIndex = rowNumber - 1
      rows[rowIndex] = {}

      const excelHeight = row.height ?? (worksheet.properties.defaultRowHeight || 15)
      const pixelHeight = Math.ceil(excelHeight * 1.3333)

      rowMetadata[rowIndex] = { id: rowIndex, height: pixelHeight }

      row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        const colIndex = colNumber - 1
        let backgroundColor: string | undefined = undefined
        if (cell.fill && cell.fill.type === 'pattern') {
          const fill = cell.fill as any
          if (fill.pattern === 'solid') backgroundColor = resolveExcelColor(fill.fgColor)
          else if (fill.fgColor) backgroundColor = resolveExcelColor(fill.fgColor)
        }
        const fontColor = resolveExcelColor(cell.font?.color) || '#000000'
        const resolveBorder = (borderObj: any) => {
          if (!borderObj) return undefined
          return {
            style: borderObj.style || 'thin',
            color: resolveExcelColor(borderObj.color) || '#000000',
          }
        }

        const rawValue = formatCellValue(cell.value)

        let isWrapText = cell.alignment?.wrapText
        if (rawValue.includes('\n')) {
          isWrapText = true
        }
        if (isWrapText === undefined) {
          isWrapText = false
        }

        const textRotation = cell.alignment?.textRotation

        let align = cell.alignment?.horizontal as any
        if (!align) {
          if (typeof cell.value === 'number') align = 'right'
          else if (
            typeof cell.value === 'boolean' ||
            cell.value === 'true' ||
            cell.value === 'false'
          )
            align = 'center'
          else align = 'left'
        }

        let vertAlign = cell.alignment?.vertical as any
        if (!vertAlign) {
          vertAlign = 'middle'
        }
        if (vertAlign === 'middle') vertAlign = 'center'

        const diagonal = (cell.border as any)?.diagonal

        const style: CellStyle = {
          bold: cell.font?.bold || false,
          italic: cell.font?.italic || false,
          color: fontColor,
          backgroundColor,
          align,
          verticalAlign: vertAlign,
          wrapText: isWrapText,
          textRotation: typeof textRotation === 'object' ? undefined : textRotation,
          diagonalUp: diagonal?.up ? mapBorderToString(diagonal) : undefined,
          diagonalDown: diagonal?.down ? mapBorderToString(diagonal) : undefined,
        }

        if (cell.border) {
          style.border = {}
          if (cell.border.top) style.border.top = resolveBorder(cell.border.top)
          if (cell.border.bottom) style.border.bottom = resolveBorder(cell.border.bottom)
          if (cell.border.left) style.border.left = resolveBorder(cell.border.left)
          if (cell.border.right) style.border.right = resolveBorder(cell.border.right)
        }

        const { value, config } = parseSpecialSyntax(rawValue)
        rows[rowIndex]![colIndex] = { value, style, inputConfig: config }
      })
    })

    for (let r = 0; r < rowCount; r++) {
      if (!rowMetadata[r]) {
        const pixelHeight = Math.ceil((worksheet.properties.defaultRowHeight || 15) * 1.3333)
        rowMetadata[r] = { id: r, height: pixelHeight }
      }
    }

    const shapes: ExcelShape[] = []
    const images = worksheet.getImages()
    if (images && Array.isArray(images)) {
      images.forEach((image: any) => {
        const media = findMedia(workbook, image.imageId)
        if (media && media.buffer) {
          const mimeType =
            media.type === 'jpg' || media.type === 'jpeg' ? 'image/jpeg' : 'image/png'
          const base64 = bufferToBase64(media.buffer)
          const tl = image.range.tl
          const br = image.range.br
          const fromCol = Math.floor(tl.nativeCol ?? tl.col ?? 0)
          const fromRow = Math.floor(tl.nativeRow ?? tl.row ?? 0)
          const fromColOff = tl.nativeColOff ?? tl.colOff ?? 0
          const fromRowOff = tl.nativeRowOff ?? tl.rowOff ?? 0
          let x = 0
          for (let c = 0; c < fromCol; c++) x += columns[c]?.width || 80
          x += fromColOff / EMU_PER_PIXEL
          let y = 0
          for (let r = 0; r < fromRow; r++) y += rowMetadata[r]?.height || 24
          y += fromRowOff / EMU_PER_PIXEL
          let w = 100,
            h = 100
          if (br) {
            const toCol = Math.floor(br.nativeCol ?? br.col ?? 0)
            const toRow = Math.floor(br.nativeRow ?? br.row ?? 0)
            const toColOff = br.nativeColOff ?? br.colOff ?? 0
            const toRowOff = br.nativeRowOff ?? br.rowOff ?? 0
            let x2 = 0
            for (let c = 0; c < toCol; c++) x2 += columns[c]?.width || 80
            x2 += toColOff / EMU_PER_PIXEL
            let y2 = 0
            for (let r = 0; r < toRow; r++) y2 += rowMetadata[r]?.height || 24
            y2 += toRowOff / EMU_PER_PIXEL
            x = Math.min(x, x2)
            y = Math.min(y, y2)
            w = Math.abs(x2 - x)
            h = Math.abs(y2 - y)
          } else if (image.range.ext) {
            w = image.range.ext.width / EMU_PER_PIXEL
            h = image.range.ext.height / EMU_PER_PIXEL
          }
          shapes.push({
            id: `img_${shapes.length}`,
            type: 'image',
            src: `data:${mimeType};base64,${base64}`,
            x: Math.round(x),
            y: Math.round(y),
            w: Math.round(w),
            h: Math.round(h),
          })
        }
      })
    }

    // PARSE VECTOR SHAPES
    const mappedFilename = sheetMap[worksheet.name] || `sheet${(worksheet as any).id}.xml`
    const vectorShapes = await parseDrawingXml(zip, mappedFilename, columns, rowMetadata)
    vectorShapes.forEach((vs) => shapes.push(vs))

    sheets.push({
      name: worksheet.name,
      rows,
      rowMetadata,
      rowCount: Math.max(rowCount, 20),
      colCount: Math.max(colCount, columns.length),
      columns,
      merges,
      shapes,
    })
  }

  return sheets.length > 0 ? sheets : [generateEmptySheet('Sheet1')]
}

const hexToArgb = (hex?: string): string | undefined => {
  if (!hex) return undefined
  let c = hex.startsWith('#') ? hex.substring(1) : hex
  if (c.length === 3) {
    c = c
      .split('')
      .map((char) => char + char)
      .join('')
  }
  if (c.length === 6) {
    return 'FF' + c.toUpperCase()
  }
  if (c.length === 8) {
    return c.toUpperCase()
  }
  return undefined
}

const getAnchorFromPixels = (
  x: number,
  y: number,
  w: number,
  h: number,
  columns: ColumnMetadata[],
  rowMetadata: { [key: number]: RowMetadata },
) => {
  let currentX = 0
  let colIndex = 0
  let colOffset = 0
  for (let i = 0; i < columns.length; i++) {
    const colW = columns[i]!.width
    if (currentX + colW > x) {
      colIndex = i
      colOffset = x - currentX
      break
    }
    currentX += colW
    colIndex = i + 1
  }

  let currentY = 0
  let rowIndex = 0
  let rowOffset = 0
  const maxRow = Math.max(...Object.keys(rowMetadata).map(Number), 0)
  for (let i = 0; i <= maxRow + 100; i++) {
    const rowH = rowMetadata[i]?.height || 24
    if (currentY + rowH > y) {
      rowIndex = i
      rowOffset = y - currentY
      break
    }
    currentY += rowH
    rowIndex = i + 1
  }

  return {
    tl: {
      col: colIndex,
      row: rowIndex,
      nativeColOff: Math.round(colOffset * EMU_PER_PIXEL),
      nativeRowOff: Math.round(rowOffset * EMU_PER_PIXEL),
    },
    ext: { width: w, height: h },
  }
}

const shapeToImage = async (shape: ExcelShape): Promise<string | null> => {
  return new Promise((resolve) => {
    try {
      const canvas = document.createElement('canvas')
      canvas.width = shape.w || 100
      canvas.height = shape.h || 100
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        resolve(null)
        return
      }

      ctx.fillStyle = shape.fill === 'transparent' ? 'rgba(0,0,0,0)' : shape.fill || 'transparent'
      ctx.strokeStyle =
        shape.stroke === 'transparent' ? 'rgba(0,0,0,0)' : shape.stroke || 'transparent'
      ctx.lineWidth = shape.strokeWidth || 1

      if (shape.shapeType === 'rect' || !shape.shapeType) {
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        if (shape.stroke) ctx.strokeRect(0, 0, canvas.width, canvas.height)
      } else if (shape.shapeType === 'ellipse') {
        ctx.beginPath()
        ctx.ellipse(
          canvas.width / 2,
          canvas.height / 2,
          canvas.width / 2,
          canvas.height / 2,
          0,
          0,
          2 * Math.PI,
        )
        ctx.fill()
        if (shape.stroke) ctx.stroke()
      } else if (shape.shapeType === 'roundRect') {
        const r = 10
        ctx.beginPath()
        ctx.roundRect(0, 0, canvas.width, canvas.height, r)
        ctx.fill()
        if (shape.stroke) ctx.stroke()
      } else if (shape.shapeType === 'triangle') {
        ctx.beginPath()
        ctx.moveTo(canvas.width / 2, 0)
        ctx.lineTo(canvas.width, canvas.height)
        ctx.lineTo(0, canvas.height)
        ctx.closePath()
        ctx.fill()
        if (shape.stroke) ctx.stroke()
      }

      if (shape.text) {
        ctx.fillStyle = shape.textColor || '#000000'
        ctx.font = `${shape.textBold ? 'bold ' : ''}${shape.textSize || 11}pt Calibri`
        ctx.textAlign = shape.textAlign || 'center'
        ctx.textBaseline = 'middle'
        const tx =
          shape.textAlign === 'left'
            ? 5
            : shape.textAlign === 'right'
              ? canvas.width - 5
              : canvas.width / 2
        const ty =
          shape.textVertical === 'top'
            ? 10
            : shape.textVertical === 'bottom'
              ? canvas.height - 10
              : canvas.height / 2
        ctx.fillText(shape.text, tx, ty)
      }

      resolve(canvas.toDataURL('image/png'))
    } catch (e) {
      console.warn('Shape render failed', e)
      resolve(null)
    }
  })
}

export const exportToExcelBlob = async (sheets: SheetData[]): Promise<Blob> => {
  const workbook = new ExcelJS.Workbook()

  for (const sheet of sheets) {
    const worksheet = workbook.addWorksheet(sheet.name || 'Sheet')
    worksheet.views = [{ showGridLines: false }]

    worksheet.columns = sheet.columns.map((col) => ({
      header: '',
      key: String(col.id),
      width: Math.max(col.width / 7.2, 2),
    }))

    for (let r = 0; r < sheet.rowCount; r++) {
      const row = worksheet.getRow(r + 1)
      if (sheet.rowMetadata && sheet.rowMetadata[r]) {
        row.height = sheet.rowMetadata[r]!.height * 0.75
      }

      for (let c = 0; c < sheet.colCount; c++) {
        const cellData = sheet.rows[r]?.[c]
        const cell = row.getCell(c + 1)

        if (cellData) {
          if (typeof cellData.value === 'string' && cellData.value.startsWith('data:image')) {
            try {
              const base64Content = cellData.value.split(',')[1]
              const extension = cellData.value.includes('image/png') ? 'png' : 'jpeg'
              const imageId = workbook.addImage({
                base64: base64Content,
                extension: extension as any,
              })
              worksheet.addImage(imageId, {
                tl: { col: c, row: r, nativeColOff: 0, nativeRowOff: 0 },
                ext: {
                  width: sheet.columns[c]!.width,
                  height: sheet.rowMetadata[r]?.height || 24,
                },
              })
              cell.value = ''
            } catch (e) {
              console.log(e)

              cell.value = '(Image Error)'
            }
          } else {
            if (cellData.inputConfig?.type === 'boolean') {
              if (cellData.value === 'true') cell.value = 'YES'
              else if (cellData.value === 'false') cell.value = 'NO'
              else cell.value = ''
              if (!cellData.style?.align) {
                cell.alignment = { ...cell.alignment, horizontal: 'center' }
              }
            } else if (cellData.inputConfig?.type === 'date' && cellData.value) {
              try {
                const d = new Date(cellData.value as string)
                cell.value = d
                cell.numFmt = 'dd-mmm-yy'
              } catch (e) {
                console.log(e)

                cell.value = cellData.value
              }
            } else {
              if (
                cellData.value === '' ||
                cellData.value === null ||
                cellData.value === undefined
              ) {
                // Write placeholder as cell value if inputConfig exists and cell is empty
                if (cellData.inputConfig?.placeholder) {
                  cell.value = cellData.inputConfig.placeholder
                  cell.font = {
                    ...cell.font,
                    name: 'Calibri',
                    size: 11,
                    color: { argb: 'FF9CA3AF' }, // gray-400
                    italic: true,
                  }
                } else if (cellData.inputConfig?.label) {
                  cell.value = `[${cellData.inputConfig.label}]`
                  cell.font = {
                    ...cell.font,
                    name: 'Calibri',
                    size: 11,
                    color: { argb: 'FF9CA3AF' },
                    italic: true,
                  }
                } else {
                  cell.value = null
                }
              } else {
                cell.value = cellData.value as any
              }
            }
          }

          // Export inputConfig as Excel Data Validation
          if (cellData.inputConfig) {
            const config = cellData.inputConfig
            if (config.type === 'select' && config.options && config.options.length > 0) {
              cell.dataValidation = {
                type: 'list',
                allowBlank: !config.required,
                formulae: [`"${config.options.join(',')}"`],
                showErrorMessage: true,
                errorTitle: 'Invalid Selection',
                error:
                  config.validation?.message || `Please select from: ${config.options.join(', ')}`,
              }
            } else if (config.type === 'number') {
              const hasMin = config.validation?.min !== undefined
              const hasMax = config.validation?.max !== undefined
              if (hasMin || hasMax) {
                cell.dataValidation = {
                  type: 'whole',
                  operator:
                    hasMin && hasMax
                      ? 'between'
                      : hasMin
                        ? 'greaterThanOrEqual'
                        : 'lessThanOrEqual',
                  allowBlank: !config.required,
                  formulae:
                    hasMin && hasMax
                      ? [config.validation!.min!, config.validation!.max!]
                      : [hasMin ? config.validation!.min! : config.validation!.max!],
                  showErrorMessage: true,
                  errorTitle: 'Invalid Number',
                  error:
                    config.validation?.message ||
                    `Value must be ${hasMin ? `≥ ${config.validation!.min}` : ''}${hasMin && hasMax ? ' and ' : ''}${hasMax ? `≤ ${config.validation!.max}` : ''}`,
                }
              }
            } else if (config.type === 'date') {
              cell.dataValidation = {
                type: 'date',
                operator: 'greaterThanOrEqual',
                allowBlank: !config.required,
                formulae: [new Date(1900, 0, 1)],
                showErrorMessage: true,
                errorTitle: 'Invalid Date',
                error: 'Please enter a valid date.',
              }
            } else if (config.type === 'boolean') {
              cell.dataValidation = {
                type: 'list',
                allowBlank: true,
                formulae: ['"YES,NO"'],
              }
            }

            // Add input prompt with label/placeholder
            if (config.label || config.placeholder) {
              cell.dataValidation = {
                ...cell.dataValidation,
                showInputMessage: true,
                promptTitle: config.label || '',
                prompt: config.placeholder || (config.required ? '(Required)' : '(Optional)'),
              } as ExcelJS.DataValidation
            }
          }

          if (cellData.style) {
            const s = cellData.style
            const argbColor = hexToArgb(s.color)
            cell.font = {
              name: 'Calibri',
              size: 11,
              bold: s.bold,
              italic: s.italic,
              color: argbColor ? { argb: argbColor } : undefined,
            }

            if (s.backgroundColor && s.backgroundColor !== 'transparent') {
              const bgArgb = hexToArgb(s.backgroundColor)
              if (bgArgb) {
                cell.fill = {
                  type: 'pattern',
                  pattern: 'solid',
                  fgColor: { argb: bgArgb },
                }
              }
            }

            const va = s.verticalAlign === 'center' ? 'middle' : s.verticalAlign
            const ha = s.align === 'centerContinuous' ? 'center' : s.align

            const alignmentObj: Partial<ExcelJS.Alignment> = {}
            if (ha) alignmentObj.horizontal = ha as ExcelJS.Alignment['horizontal']
            // Always set vertical alignment for merged cells (ExcelJS requirement)
            alignmentObj.vertical = (va || 'middle') as ExcelJS.Alignment['vertical']
            if (s.wrapText !== undefined) alignmentObj.wrapText = s.wrapText

            cell.alignment = alignmentObj

            if (s.textRotation !== undefined) {
              cell.alignment.textRotation = s.textRotation as any
            }

            const excelBorder: Partial<ExcelJS.Borders> = {}

            if (s.border) {
              const mapBorder = (side: any) => {
                if (!side) return undefined
                let style = side.style
                if (style === 'solid') style = 'thin'
                const borderColor = hexToArgb(side.color)
                return {
                  style: style as any,
                  color: { argb: borderColor || 'FF000000' },
                }
              }

              if (s.border.top) excelBorder.top = mapBorder(s.border.top)
              if (s.border.left) excelBorder.left = mapBorder(s.border.left)
              if (s.border.bottom) excelBorder.bottom = mapBorder(s.border.bottom)
              if (s.border.right) excelBorder.right = mapBorder(s.border.right)
            }

            if (s.diagonalUp || s.diagonalDown) {
              const diagStr = s.diagonalUp || s.diagonalDown
              if (diagStr) {
                const parts = diagStr.split(' ')
                let style = 'thin'
                let color = '#000000'
                if (parts.length >= 2) {
                  style = parts[1]!
                  if (parts.length >= 3) color = parts[2]!
                }
                if (style === 'solid') style = 'thin'

                excelBorder.diagonal = {
                  up: !!s.diagonalUp,
                  down: !!s.diagonalDown,
                  style: style as any,
                  color: { argb: hexToArgb(color) || 'FF000000' },
                }
              }
            }

            if (Object.keys(excelBorder).length > 0) {
              cell.border = excelBorder
            }
          }
        }
      }
    }

    sheet.merges.forEach((m) => {
      try {
        if (m.s.r <= m.e.r && m.s.c <= m.e.c) {
          const cellData = sheet.rows[m.s.r]?.[m.s.c]
          worksheet.mergeCells(m.s.r + 1, m.s.c + 1, m.e.r + 1, m.e.c + 1)
          // Re-apply alignment after merge since ExcelJS resets it
          if (cellData?.style) {
            const s = cellData.style
            const masterCell = worksheet.getCell(m.s.r + 1, m.s.c + 1)
            const va = s.verticalAlign === 'center' ? 'middle' : s.verticalAlign
            const ha = s.align === 'centerContinuous' ? 'center' : s.align
            const reAlign: Partial<ExcelJS.Alignment> = {}
            if (ha) reAlign.horizontal = ha as ExcelJS.Alignment['horizontal']
            // Always set vertical alignment for merged cells (ExcelJS requirement)
            reAlign.vertical = (va || 'middle') as ExcelJS.Alignment['vertical']
            if (s.wrapText !== undefined) reAlign.wrapText = s.wrapText
            if (s.textRotation !== undefined) reAlign.textRotation = s.textRotation as any

            masterCell.alignment = reAlign
          }
        }
      } catch (e) {
        console.log(e)
      }
    })

    if (sheet.shapes) {
      for (const shape of sheet.shapes) {
        let base64Content = ''
        let extension = 'png'

        if (shape.type === 'image' && shape.src && shape.src.startsWith('data:image')) {
          base64Content = shape.src.split(',')[1]!
          extension = shape.src.includes('image/png') ? 'png' : 'jpeg'
        } else if (shape.type === 'form') {
          const pngDataUrl = await shapeToImage(shape)
          if (pngDataUrl) {
            base64Content = pngDataUrl.split(',')[1]!
            extension = 'png'
          }
        }

        if (base64Content) {
          try {
            const imageId = workbook.addImage({
              base64: base64Content,
              extension: extension as any,
            })

            const anchor = getAnchorFromPixels(
              shape.x,
              shape.y,
              shape.w,
              shape.h,
              sheet.columns,
              sheet.rowMetadata,
            )

            worksheet.addImage(imageId, {
              tl: anchor.tl,
              ext: anchor.ext,
              editAs: 'oneCell',
            })
          } catch (e) {
            console.warn('Failed to export shape/image', e)
          }
        }
      }
    }
  }

  const buffer = await workbook.xlsx.writeBuffer()
  return new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
}
