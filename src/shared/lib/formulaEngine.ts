import type { SheetData } from '@/shared/types'

/**
 * Parse a column label (e.g., "A", "B", "AA") to a 0-based column index.
 */
const colLabelToIndex = (label: string): number => {
  let index = 0
  for (let i = 0; i < label.length; i++) {
    index = index * 26 + (label.charCodeAt(i) - 64)
  }
  return index - 1
}

/**
 * Parse a cell reference like "E2" into { row, col } (0-based).
 */
const parseCellRef = (ref: string): { row: number; col: number } | null => {
  const match = ref.match(/^([A-Z]+)(\d+)$/i)
  if (!match || !match[1] || !match[2]) return null
  const colLabel = match[1] as string
  const rowLabel = match[2] as string
  const col = colLabelToIndex(colLabel.toUpperCase())
  const row = parseInt(rowLabel, 10) - 1
  return { row, col }
}

/**
 * Get a numeric value from a cell. Returns NaN if not a number.
 */
const getCellNumericValue = (sheet: SheetData, row: number, col: number): number => {
  const cell = sheet.rows[row]?.[col]
  if (!cell || cell.value === null || cell.value === undefined) return 0
  const val = typeof cell.value === 'string' ? evaluateFormula(cell.value, sheet) : cell.value
  const num = Number(val)
  return isNaN(num) ? 0 : num
}

/**
 * Get raw cell value (string or number).
 */
const getCellValue = (sheet: SheetData, row: number, col: number): string | number | null => {
  const cellRow = sheet.rows[row]
  if (!cellRow) return null
  const cell = cellRow[col]
  if (!cell || cell.value === null || cell.value === undefined) return null
  if (typeof cell.value === 'string' && cell.value.startsWith('=')) {
    return evaluateFormula(cell.value, sheet)
  }
  return cell.value
}

/**
 * Expand a range like "E2:G5" into an array of { row, col }.
 */
const expandRange = (rangeStr: string): { row: number; col: number }[] => {
  const parts = rangeStr.split(':')
  if (parts.length !== 2 || !parts[0] || !parts[1]) return []
  const start = parseCellRef(parts[0].trim())
  const end = parseCellRef(parts[1].trim())
  if (!start || !end) return []

  const cells: { row: number; col: number }[] = []
  const minRow = Math.min(start.row, end.row)
  const maxRow = Math.max(start.row, end.row)
  const minCol = Math.min(start.col, end.col)
  const maxCol = Math.max(start.col, end.col)

  for (let r = minRow; r <= maxRow; r++) {
    for (let c = minCol; c <= maxCol; c++) {
      cells.push({ row: r, col: c })
    }
  }
  return cells
}

/**
 * Collect numeric values from a list of arguments (cell refs, ranges, or literals).
 */
const collectValues = (args: string[], sheet: SheetData): number[] => {
  const values: number[] = []
  for (const arg of args) {
    const trimmed = arg.trim()
    if (trimmed.includes(':')) {
      // Range reference
      const cells = expandRange(trimmed)
      for (const { row, col } of cells) {
        values.push(getCellNumericValue(sheet, row, col))
      }
    } else {
      const ref = parseCellRef(trimmed)
      if (ref) {
        values.push(getCellNumericValue(sheet, ref.row, ref.col))
      } else {
        const num = Number(trimmed)
        if (!isNaN(num)) values.push(num)
      }
    }
  }
  return values
}

/**
 * Split function arguments respecting nested parentheses.
 */
const splitArgs = (argsStr: string): string[] => {
  const args: string[] = []
  let depth = 0
  let current = ''
  for (const ch of argsStr) {
    if (ch === '(') depth++
    else if (ch === ')') depth--
    if (ch === ',' && depth === 0) {
      args.push(current.trim())
      current = ''
    } else {
      current += ch
    }
  }
  if (current.trim()) args.push(current.trim())
  return args
}

/**
 * Evaluate a built-in function.
 */
const evaluateFunction = (funcName: string, argsStr: string, sheet: SheetData): number | string => {
  const args = splitArgs(argsStr)
  const values = collectValues(args, sheet)

  switch (funcName) {
    case 'SUM':
      return values.reduce((a, b) => a + b, 0)
    case 'AVERAGE':
    case 'AVG':
      return values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0
    case 'MIN':
      return values.length > 0 ? Math.min(...values) : 0
    case 'MAX':
      return values.length > 0 ? Math.max(...values) : 0
    case 'COUNT':
      return values.length
    case 'ABS':
      return values.length > 0 ? Math.abs(values[0]!) : 0
    case 'ROUND': {
      const val = values[0] !== undefined ? values[0] : 0
      const decimals = values[1] !== undefined ? values[1] : 0
      const factor = Math.pow(10, decimals)
      return Math.round(val * factor) / factor
    }
    case 'IF': {
      // =IF(condition, trueVal, falseVal) — simplified: condition is numeric (0=false)
      const condition = values[0] ?? 0
      const trueVal = args[1] !== undefined ? resolveArg(args[1].trim(), sheet) : 0
      const falseVal = args[2] !== undefined ? resolveArg(args[2].trim(), sheet) : 0
      return condition !== 0 ? trueVal : falseVal
    }
    default:
      return `#NAME?`
  }
}

/**
 * Resolve a single argument to a number or string.
 */
const resolveArg = (arg: string, sheet: SheetData): number | string => {
  // String literal
  if (arg.startsWith('"') && arg.endsWith('"')) {
    return arg.slice(1, -1)
  }
  // Cell reference
  const ref = parseCellRef(arg)
  if (ref) {
    const val = getCellValue(sheet, ref.row, ref.col)
    return val ?? 0
  }
  // Number
  const num = Number(arg)
  if (!isNaN(num)) return num
  return arg
}

/**
 * Replace cell references in an expression with their numeric values for arithmetic evaluation.
 */
const substituteCellRefs = (expr: string, sheet: SheetData): string => {
  // Match cell references like A1, AA99, etc. but not inside function names
  return expr.replace(/\b([A-Z]+)(\d+)\b/gi, (match) => {
    const ref = parseCellRef(match)
    if (ref) {
      return String(getCellNumericValue(sheet, ref.row, ref.col))
    }
    return match
  })
}

/**
 * Safely evaluate a simple arithmetic expression (no eval).
 * Supports: +, -, *, /, parentheses, numbers.
 */
const evaluateArithmetic = (expr: string): number | string => {
  try {
    const tokens = tokenize(expr)
    const result = parseExpression(tokens, { pos: 0 })
    return result
  } catch {
    return '#ERROR!'
  }
}

interface TokenPos {
  pos: number
}

const tokenize = (expr: string): string[] => {
  const tokens: string[] = []
  let i = 0
  while (i < expr.length) {
    if (expr[i]! === ' ') {
      i++
      continue
    }
    if ('+-*/()'.includes(expr[i]!)) {
      tokens.push(expr[i]!)
      i++
    } else if (/[\d.]/.test(expr[i]!)) {
      let num = ''
      while (i < expr.length && /[\d.]/.test(expr[i]!)) {
        num += expr[i]
        i++
      }
      tokens.push(num)
    } else {
      return tokens // unexpected char
    }
  }
  return tokens
}

const parseExpression = (tokens: string[], ctx: TokenPos): number => {
  let left = parseTerm(tokens, ctx)
  while (ctx.pos < tokens.length && (tokens[ctx.pos] === '+' || tokens[ctx.pos] === '-')) {
    const op = tokens[ctx.pos]
    ctx.pos++
    const right = parseTerm(tokens, ctx)
    left = op === '+' ? left + right : left - right
  }
  return left
}

const parseTerm = (tokens: string[], ctx: TokenPos): number => {
  let left = parseFactor(tokens, ctx)
  while (ctx.pos < tokens.length && (tokens[ctx.pos] === '*' || tokens[ctx.pos] === '/')) {
    const op = tokens[ctx.pos]
    ctx.pos++
    const right = parseFactor(tokens, ctx)
    left = op === '*' ? left * right : right !== 0 ? left / right : NaN
  }
  return left
}

const parseFactor = (tokens: string[], ctx: TokenPos): number => {
  // Handle unary minus
  const token = tokens[ctx.pos]
  if (token === '-') {
    ctx.pos++
    return -parseFactor(tokens, ctx)
  }
  if (token === '(') {
    ctx.pos++ // skip (
    const val = parseExpression(tokens, ctx)
    ctx.pos++ // skip )
    return val
  }
  const val = parseFloat(token ?? '0')
  ctx.pos++
  return val
}

/**
 * Main entry: evaluate a formula string.
 * If the value starts with "=", it's treated as a formula.
 * Otherwise, returns the value as-is.
 */
export const evaluateFormula = (
  value: string | number | null,
  sheet: SheetData,
): string | number | null => {
  if (value === null || value === undefined) return null
  if (typeof value === 'number') return value
  if (!value.startsWith('=')) return value

  const formula = value.substring(1).trim()

  // Check for function call: FUNCNAME(...)
  const funcMatch = formula.match(/^([A-Z]+)\((.+)\)$/i)
  if (funcMatch && funcMatch[1] && funcMatch[2]) {
    const funcName = funcMatch[1].toUpperCase()
    const argsStr = funcMatch[2]
    const result = evaluateFunction(funcName, argsStr, sheet)
    return result
  }

  // Otherwise treat as arithmetic expression with cell references
  const substituted = substituteCellRefs(formula, sheet)
  return evaluateArithmetic(substituted)
}

/**
 * Check if a value is a formula (starts with "=").
 */
export const isFormula = (value: string | number | null): boolean => {
  return typeof value === 'string' && value.startsWith('=')
}
