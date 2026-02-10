export enum UserRole {
  ADMIN = 'Admin',
  MANAGER = 'Manager',
  STAFF = 'Staff',
  VIEWER = 'Viewer',
}

export type AppMode = 'designer' | 'operator' | 'manual'
export type ThemeType = 'light' | 'dark' | 'system'

export interface User {
  id: string
  name: string
  role: UserRole
  avatar: string
}

export type InputType = 'text' | 'number' | 'select' | 'boolean' | 'image' | 'date' | 'symbol'

export interface ValidationRule {
  min?: number
  max?: number
  minLength?: number
  maxLength?: number
  pattern?: string
  message?: string
}

export interface ConditionalLogic {
  dependencyLabel: string
  value: string
  action: 'show' | 'enable'
}

export interface InputConfig {
  type: InputType
  label?: string
  options?: string[]
  placeholder?: string
  required?: boolean
  validation?: ValidationRule
  conditional?: ConditionalLogic
  allowedRoles?: UserRole[]
}

export interface BorderStyle {
  style: string
  color: string
}

export interface CellStyle {
  bold?: boolean
  italic?: boolean
  underline?: boolean
  color?: string
  backgroundColor?: string
  width?: number
  border?: {
    top?: BorderStyle
    bottom?: BorderStyle
    left?: BorderStyle
    right?: BorderStyle
  }
  align?: 'left' | 'center' | 'right' | 'justify' | 'centerContinuous'
  verticalAlign?: 'top' | 'center' | 'bottom'
  wrapText?: boolean
  textRotation?: number | 'vertical'
  diagonalUp?: string
  diagonalDown?: string
}

export interface CellData {
  value: string | number | null
  style?: CellStyle
  inputConfig?: InputConfig
}

export interface ColumnMetadata {
  id: number
  width: number
  permissions: UserRole[]
  header: string
}

export interface RowMetadata {
  id: number
  height: number
}

export interface MergeRange {
  s: { r: number; c: number }
  e: { r: number; c: number }
}

export interface ExcelShape {
  id: string
  type: 'image' | 'form'
  src?: string

  shapeType?: string
  fill?: string
  stroke?: string
  strokeWidth?: number
  strokeDash?: string

  text?: string
  textColor?: string
  textSize?: number
  textBold?: boolean
  textAlign?: 'left' | 'center' | 'right'
  textVertical?: 'top' | 'center' | 'bottom'

  flipH?: boolean
  flipV?: boolean
  rotation?: number
  opacity?: number

  from?: { col: number; row: number; colOff: number; rowOff: number }
  to?: { col: number; row: number; colOff: number; rowOff: number }

  x: number
  y: number
  w: number
  h: number

  inputConfig?: InputConfig
  value?: string | number | null
}

export interface SheetData {
  name: string
  rows: { [key: number]: { [key: number]: CellData } }
  rowMetadata: { [key: number]: RowMetadata }
  rowCount: number
  colCount: number
  columns: ColumnMetadata[]
  merges: MergeRange[]
  shapes: ExcelShape[]
}

export interface AnalysisResult {
  summary: string
  insights: string[]
}

export interface SavedRecord {
  id: string
  projectName: string
  submitter: string
  category?: string
  version?: string
  status: string
  date: string
  data: SheetData[]
}

export interface ProjectVersion {
  id: string
  timestamp: string
  createdBy: string
  data: SheetData[]
}

export interface Project {
  id: number | string
  name: string
  category: string
  date: string
  size: string
  status: string
  data: SheetData[]
  versions: ProjectVersion[]
}
