import type { CSSProperties } from 'vue'
import type { CellStyle } from '@/shared/types'

// Colors
const GRID_COLOR_LIGHT = '#d1d5db' // gray-300
const GRID_COLOR_DARK = '#374151' // gray-700
const BG_DEFAULT_LIGHT = '#ffffff'
const BG_DEFAULT_DARK = '#111827' // gray-900

const getBorderStyle = (styleName?: string): string => {
  switch (styleName) {
    case 'medium':
      return '2px solid'
    case 'thick':
      return '3px solid'
    case 'dotted':
      return '1px dotted'
    case 'dashed':
      return '1px dashed'
    case 'double':
      return '3px double'
    case 'thin':
    default:
      return '1px solid'
  }
}

export const getDiagonalSvg = (
  styleStr: string | undefined,
  type: 'up' | 'down',
  isDarkMode: boolean,
): string | null => {
  if (!styleStr) return null

  const parts = styleStr.split(' ')
  const width = parseInt(parts[0]!) || 1
  const isDashed = parts[1] === 'dashed' || styleStr.includes('dash')
  const isDotted = parts[1] === 'dotted' || styleStr.includes('dot')
  let color = parts[parts.length - 1] || (isDarkMode ? '#e5e7eb' : '#000000')

  // If color is black/white default, adapt to mode
  if (color === '#000000' && isDarkMode) color = '#e5e7eb'
  if (color === '#ffffff' && !isDarkMode) color = '#000000'

  let dashAttr = ''
  if (isDashed) dashAttr = 'stroke-dasharray="4,2"'
  if (isDotted) dashAttr = 'stroke-dasharray="1,1"'

  const line =
    type === 'up'
      ? `<line x1="0" y1="100%" x2="100%" y2="0" stroke="${color}" stroke-width="${width}" ${dashAttr} />`
      : `<line x1="0" y1="0" x2="100%" y2="100%" stroke="${color}" stroke-width="${width}" ${dashAttr} />`

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" preserveAspectRatio="none">${line}</svg>`
  return `url('data:image/svg+xml;base64,${btoa(svg)}')`
}

export const buildCellCssStyle = (
  s: CellStyle | undefined,
  rowHeight: number,
  showGridlines: boolean,
  zIndex: number,
  isDarkMode: boolean,
): CSSProperties => {
  let bgStyle = s?.backgroundColor

  // Handle transparent/default bg
  if (!bgStyle || bgStyle === 'transparent' || bgStyle === '#fff' || bgStyle === '#FFFFFF') {
    bgStyle = isDarkMode ? BG_DEFAULT_DARK : BG_DEFAULT_LIGHT
  }

  // Generate Diagonals
  const upSvg = getDiagonalSvg(s?.diagonalUp, 'up', isDarkMode)
  const downSvg = getDiagonalSvg(s?.diagonalDown, 'down', isDarkMode)
  const backgrounds: string[] = []
  if (upSvg) backgrounds.push(upSvg)
  if (downSvg) backgrounds.push(downSvg)

  // Resolve Grid Color
  const gridColor = isDarkMode ? GRID_COLOR_DARK : GRID_COLOR_LIGHT

  // Resolve Text Color (auto-invert if default black)
  let textColor = s?.color
  if (!textColor || textColor === '#000000') {
    textColor = isDarkMode ? '#e5e7eb' : '#111827' // gray-200 : gray-900
  }

  return {
    fontWeight: s?.bold ? 'bold' : 'normal',
    fontStyle: s?.italic ? 'italic' : 'normal',
    textDecoration: s?.underline ? 'underline' : 'none',
    color: textColor,
    backgroundColor: bgStyle,
    backgroundImage: backgrounds.length > 0 ? backgrounds.join(', ') : undefined,
    backgroundSize: '100% 100%',
    backgroundRepeat: 'no-repeat',
    borderTop: s?.border?.top
      ? `${getBorderStyle(s.border.top.style)} ${s.border.top.color}`
      : undefined,
    borderLeft: s?.border?.left
      ? `${getBorderStyle(s.border.left.style)} ${s.border.left.color}`
      : undefined,
    borderRight: s?.border?.right
      ? `${getBorderStyle(s.border.right.style)} ${s.border.right.color}`
      : showGridlines
        ? `1px solid ${gridColor}`
        : undefined,
    borderBottom: s?.border?.bottom
      ? `${getBorderStyle(s.border.bottom.style)} ${s.border.bottom.color}`
      : showGridlines
        ? `1px solid ${gridColor}`
        : undefined,
    position: 'relative',
    zIndex,
    height: `${rowHeight}px`,
  }
}

export const buildCellContentStyle = (s: CellStyle | undefined): CSSProperties => {
  const effectiveAlign = s?.align === 'centerContinuous' ? 'center' : s?.align || 'left'
  const effectiveVertAlign = s?.verticalAlign || 'center'

  const alignItems =
    effectiveVertAlign === 'top'
      ? 'flex-start'
      : effectiveVertAlign === 'bottom'
        ? 'flex-end'
        : 'center'
  const justifyContent =
    effectiveAlign === 'left' ? 'flex-start' : effectiveAlign === 'right' ? 'flex-end' : 'center'

  const rotation = s?.textRotation
  const isVertical = rotation === 255 || rotation === 'vertical'
  const isRotatedUp = typeof rotation === 'number' && rotation > 0 && rotation <= 90
  const isRotatedDown =
    typeof rotation === 'number' && ((rotation > 90 && rotation <= 180) || rotation < 0)
  const isOverflowHidden = s?.wrapText || isRotatedUp || isRotatedDown || isVertical

  return {
    height: '100%',
    display: 'flex',
    alignItems,
    justifyContent,
    width: '100%',
    whiteSpace: s?.wrapText ? 'pre-wrap' : 'nowrap',
    wordBreak: s?.wrapText ? 'break-word' : 'normal',
    overflow: isOverflowHidden ? 'hidden' : 'visible',
    lineHeight: '1.3',
    paddingTop: '1px',
    paddingBottom: '1px',
    writingMode: isVertical
      ? 'vertical-lr'
      : isRotatedUp || isRotatedDown
        ? 'vertical-rl'
        : undefined,
    textOrientation: isVertical ? 'upright' : undefined,
    transform: isRotatedUp ? 'rotate(180deg)' : undefined,
    textAlign: isRotatedUp || isRotatedDown ? 'center' : effectiveAlign,
  }
}
