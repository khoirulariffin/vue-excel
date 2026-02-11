/**
 * API Contract: Load Excel
 *
 * Endpoint: POST /api/v1/excel/load
 * Content-Type: multipart/form-data
 * Body: { file: File }
 *
 * Response: ExcelLoadResponse
 */

import type { SheetData, UserRole } from '@/shared/types'

// ─── Request ────────────────────────────────────────────────────────────────

export interface ExcelLoadRequest {
  file: File
}

// ─── Response ───────────────────────────────────────────────────────────────

export interface ExcelLoadResponse {
  success: boolean
  message: string
  data: {
    fileName: string
    fileSize: number
    sheets: SheetData[]
  }
}

// ─── Dummy Response ─────────────────────────────────────────────────────────

export const dummyExcelLoadResponse: ExcelLoadResponse = {
  success: true,
  message: 'File loaded successfully',
  data: {
    fileName: 'sample-report.xlsx',
    fileSize: 24576,
    sheets: [
      {
        name: 'Employee Data',
        rowCount: 6,
        colCount: 5,
        columns: [
          { id: 0, width: 40, permissions: [], header: 'A' },
          { id: 1, width: 150, permissions: [], header: 'B' },
          { id: 2, width: 120, permissions: [], header: 'C' },
          { id: 3, width: 100, permissions: [], header: 'D' },
          { id: 4, width: 100, permissions: [], header: 'E' },
        ],
        rowMetadata: {
          0: { id: 0, height: 30 },
          1: { id: 1, height: 24 },
          2: { id: 2, height: 24 },
          3: { id: 3, height: 24 },
          4: { id: 4, height: 24 },
          5: { id: 5, height: 24 },
        },
        rows: {
          // Header row
          0: {
            0: {
              value: 'No',
              style: { bold: true, backgroundColor: '#4472C4', color: '#FFFFFF', align: 'center' },
            },
            1: {
              value: 'Employee Name',
              style: { bold: true, backgroundColor: '#4472C4', color: '#FFFFFF', align: 'center' },
            },
            2: {
              value: 'Department',
              style: { bold: true, backgroundColor: '#4472C4', color: '#FFFFFF', align: 'center' },
            },
            3: {
              value: 'Salary',
              style: { bold: true, backgroundColor: '#4472C4', color: '#FFFFFF', align: 'center' },
            },
            4: {
              value: 'Status',
              style: { bold: true, backgroundColor: '#4472C4', color: '#FFFFFF', align: 'center' },
            },
          },
          // Data rows
          1: {
            0: { value: 1, style: { align: 'center' } },
            1: { value: 'John Doe' },
            2: { value: 'Engineering' },
            3: { value: 85000, style: { align: 'right' } },
            4: { value: 'Active', style: { color: '#2E7D32' } },
          },
          2: {
            0: { value: 2, style: { align: 'center' } },
            1: { value: 'Jane Smith' },
            2: { value: 'Marketing' },
            3: { value: 72000, style: { align: 'right' } },
            4: { value: 'Active', style: { color: '#2E7D32' } },
          },
          3: {
            0: { value: 3, style: { align: 'center' } },
            1: { value: 'Bob Johnson' },
            2: { value: 'Finance' },
            3: { value: 91000, style: { align: 'right' } },
            4: { value: 'On Leave', style: { color: '#F57C00' } },
          },
          4: {
            0: { value: 4, style: { align: 'center' } },
            1: { value: 'Alice Brown' },
            2: { value: 'Engineering' },
            3: { value: 78000, style: { align: 'right' } },
            4: { value: 'Active', style: { color: '#2E7D32' } },
          },
          5: {
            0: { value: null },
            1: { value: null },
            2: { value: 'Total', style: { bold: true, align: 'right' } },
            3: { value: '=SUM(D2:D5)', style: { bold: true, align: 'right' } },
            4: { value: null },
          },
        },
        merges: [],
        shapes: [],
      },
      {
        name: 'Form Input',
        rowCount: 8,
        colCount: 4,
        columns: [
          { id: 0, width: 40, permissions: [], header: 'A' },
          { id: 1, width: 160, permissions: [], header: 'B' },
          { id: 2, width: 200, permissions: [], header: 'C' },
          { id: 3, width: 120, permissions: [], header: 'D' },
        ],
        rowMetadata: {
          0: { id: 0, height: 36 },
          1: { id: 1, height: 28 },
          2: { id: 2, height: 28 },
          3: { id: 3, height: 28 },
          4: { id: 4, height: 28 },
          5: { id: 5, height: 28 },
          6: { id: 6, height: 28 },
          7: { id: 7, height: 28 },
        },
        rows: {
          0: {
            0: {
              value: 'Employee Registration Form',
              style: { bold: true, color: '#1A237E', align: 'center' },
            },
          },
          1: {
            1: { value: 'Full Name', style: { bold: true } },
            2: {
              value: null,
              inputConfig: {
                type: 'text',
                label: 'FullName',
                placeholder: 'Enter full name',
                required: true,
                allowedRoles: ['Admin', 'Manager', 'Staff'] as UserRole[],
              },
            },
          },
          2: {
            1: { value: 'Department', style: { bold: true } },
            2: {
              value: null,
              inputConfig: {
                type: 'select',
                label: 'Department',
                options: ['Engineering', 'Marketing', 'Finance', 'HR', 'Operations'],
                placeholder: 'Select department',
                required: true,
                allowedRoles: ['Admin', 'Manager'] as UserRole[],
              },
            },
          },
          3: {
            1: { value: 'Salary', style: { bold: true } },
            2: {
              value: null,
              inputConfig: {
                type: 'number',
                label: 'Salary',
                placeholder: 'Enter salary',
                required: true,
                validation: {
                  min: 30000,
                  max: 500000,
                  message: 'Salary must be between 30,000 and 500,000',
                },
                allowedRoles: ['Admin'] as UserRole[],
              },
            },
          },
          4: {
            1: { value: 'Start Date', style: { bold: true } },
            2: {
              value: null,
              inputConfig: {
                type: 'date',
                label: 'StartDate',
                required: true,
                allowedRoles: ['Admin', 'Manager'] as UserRole[],
              },
            },
          },
          5: {
            1: { value: 'Has Insurance', style: { bold: true } },
            2: {
              value: null,
              inputConfig: {
                type: 'boolean',
                label: 'HasInsurance',
                allowedRoles: ['Admin', 'Manager'] as UserRole[],
              },
            },
          },
          6: {
            1: { value: 'Insurance Plan', style: { bold: true } },
            2: {
              value: null,
              inputConfig: {
                type: 'select',
                label: 'InsurancePlan',
                options: ['Basic', 'Standard', 'Premium'],
                placeholder: 'Select plan',
                conditional: { dependencyLabel: 'HasInsurance', value: 'true', action: 'show' },
                allowedRoles: ['Admin'] as UserRole[],
              },
            },
          },
          7: {
            1: { value: 'Notes', style: { bold: true } },
            2: {
              value: null,
              inputConfig: {
                type: 'text',
                label: 'Notes',
                placeholder: 'Additional notes...',
                required: false,
                allowedRoles: ['Admin', 'Manager', 'Staff', 'Viewer'] as UserRole[],
              },
            },
          },
        },
        merges: [{ s: { r: 0, c: 0 }, e: { r: 0, c: 3 } }],
        shapes: [],
      },
    ],
  },
}

// ─── API Service (mock) ─────────────────────────────────────────────────────

export const loadExcelFromAPI = async (_file: File): Promise<ExcelLoadResponse> => {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 800))

  // In production, replace with:
  // const formData = new FormData()
  // formData.append('file', file)
  // const response = await fetch('/api/v1/excel/load', {
  //   method: 'POST',
  //   body: formData,
  // })
  // return response.json()

  return dummyExcelLoadResponse
}
