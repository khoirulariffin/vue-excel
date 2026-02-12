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
        rowCount: 15,
        colCount: 4,
        columns: [
          { id: 0, width: 40, permissions: [], header: 'A' },
          { id: 1, width: 170, permissions: [], header: 'B' },
          { id: 2, width: 220, permissions: [], header: 'C' },
          { id: 3, width: 180, permissions: [], header: 'D' },
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
          8: { id: 8, height: 28 },
          9: { id: 9, height: 28 },
          10: { id: 10, height: 60 },
          11: { id: 11, height: 60 },
          12: { id: 12, height: 28 },
          13: { id: 13, height: 28 },
          14: { id: 14, height: 28 },
        },
        rows: {
          // ── Title ──
          0: {
            0: {
              value: 'Employee Registration Form',
              style: { bold: true, color: '#1A237E', align: 'center' },
            },
          },

          // ── 1. Text ──
          1: {
            0: { value: 1, style: { align: 'center', color: '#9E9E9E' } },
            1: { value: 'Full Name', style: { bold: true } },
            2: {
              value: null,
              inputConfig: {
                type: 'text',
                label: 'FullName',
                placeholder: 'Enter full name',
                required: true,
                validation: {
                  pattern: '^[A-Za-z ]{2,50}$',
                  message: 'Only letters and spaces, 2-50 characters',
                },
                allowedRoles: ['Admin', 'Manager', 'Staff'] as UserRole[],
              },
            },
            3: {
              value: 'text | required | regex | Admin,Manager,Staff',
              style: { color: '#9E9E9E', italic: true },
            },
          },

          // ── 2. Number (integer) ──
          2: {
            0: { value: 2, style: { align: 'center', color: '#9E9E9E' } },
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
                allowedDepartments: ['Finance', 'HR'],
              },
            },
            3: {
              value: 'number | min/max | Admin | Finance,HR',
              style: { color: '#9E9E9E', italic: true },
            },
          },

          // ── 3. Float ──
          3: {
            0: { value: 3, style: { align: 'center', color: '#9E9E9E' } },
            1: { value: 'Rating Score', style: { bold: true } },
            2: {
              value: null,
              inputConfig: {
                type: 'float',
                label: 'Rating',
                placeholder: 'e.g. 4.5',
                required: true,
                validation: {
                  min: 0,
                  max: 5,
                  message: 'Rating must be between 0.0 and 5.0',
                },
                allowedRoles: ['Admin', 'Manager'] as UserRole[],
              },
            },
            3: {
              value: 'float | 0-5 | Admin,Manager',
              style: { color: '#9E9E9E', italic: true },
            },
          },

          // ── 4. Select ──
          4: {
            0: { value: 4, style: { align: 'center', color: '#9E9E9E' } },
            1: { value: 'Has Insurance', style: { bold: true } },
            2: {
              value: null,
              inputConfig: {
                type: 'boolean',
                label: 'HasInsurance',
                required: false,
                allowedRoles: ['Admin', 'Manager'] as UserRole[],
              },
            },
            3: {
              value: 'boolean | Admin,Manager',
              style: { color: '#9E9E9E', italic: true },
            },
          },

          // ── 5. Select with Conditional Logic ──
          5: {
            0: { value: 5, style: { align: 'center', color: '#9E9E9E' } },
            1: { value: 'Insurance Plan', style: { bold: true } },
            2: {
              value: null,
              inputConfig: {
                type: 'select',
                label: 'InsurancePlan',
                options: ['Basic', 'Standard', 'Premium'],
                placeholder: 'Select plan',
                required: true,
                conditional: {
                  dependencyLabel: 'HasInsurance',
                  value: 'true',
                  action: 'show',
                },
                allowedRoles: ['Admin'] as UserRole[],
              },
            },
            3: {
              value: 'select | logic: if HasInsurance=true | Admin',
              style: { color: '#9E9E9E', italic: true },
            },
          },

          // ── 6. Date ──
          6: {
            0: { value: 6, style: { align: 'center', color: '#9E9E9E' } },
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
            3: {
              value: 'date | required | Admin,Manager',
              style: { color: '#9E9E9E', italic: true },
            },
          },

          // ── 7. Text with Conditional Logic ──
          7: {
            0: { value: 7, style: { align: 'center', color: '#9E9E9E' } },
            1: { value: 'Insurance Note', style: { bold: true } },
            2: {
              value: null,
              inputConfig: {
                type: 'text',
                label: 'InsuranceNote',
                placeholder: 'Describe insurance details...',
                required: false,
                conditional: {
                  dependencyLabel: 'InsurancePlan',
                  value: 'Premium',
                  action: 'show',
                },
                allowedRoles: ['Admin', 'Manager', 'Staff'] as UserRole[],
              },
            },
            3: {
              value: 'text | logic: if Plan=Premium | All staff',
              style: { color: '#9E9E9E', italic: true },
            },
          },

          // ── 8. Symbol ──
          8: {
            0: { value: 8, style: { align: 'center', color: '#9E9E9E' } },
            1: { value: 'Badge Icon', style: { bold: true } },
            2: {
              value: null,
              inputConfig: {
                type: 'symbol',
                label: 'BadgeIcon',
                options: ['✓', '✗', '●', '★', '⚠', '♦'],
                required: false,
                allowedRoles: ['Admin'] as UserRole[],
              },
            },
            3: {
              value: 'symbol | predefined options | Admin only',
              style: { color: '#9E9E9E', italic: true },
            },
          },

          // ── 9. Image ──
          9: {
            0: { value: 9, style: { align: 'center', color: '#9E9E9E' } },
            1: { value: 'Profile Photo', style: { bold: true } },
            2: {
              value: null,
              inputConfig: {
                type: 'image',
                label: 'ProfilePhoto',
                placeholder: 'Upload photo',
                required: false,
                allowedRoles: ['Admin', 'Manager', 'Staff'] as UserRole[],
              },
            },
            3: {
              value: 'image | Admin,Manager,Staff',
              style: { color: '#9E9E9E', italic: true },
            },
          },

          // ── 10. Draw / Signature ──
          10: {
            0: { value: 10, style: { align: 'center', color: '#9E9E9E' } },
            1: { value: 'Signature', style: { bold: true } },
            2: {
              value: null,
              inputConfig: {
                type: 'draw',
                label: 'Signature',
                placeholder: 'Sign here',
                required: true,
                allowedRoles: ['Admin', 'Manager', 'Staff'] as UserRole[],
              },
            },
            3: {
              value: 'draw | required | Admin,Manager,Staff',
              style: { color: '#9E9E9E', italic: true },
            },
          },

          // ── 11. Draw with Department Access ──
          11: {
            0: { value: 11, style: { align: 'center', color: '#9E9E9E' } },
            1: { value: 'Manager Approval', style: { bold: true } },
            2: {
              value: null,
              inputConfig: {
                type: 'draw',
                label: 'ManagerApproval',
                placeholder: 'Manager sign here',
                required: true,
                allowedRoles: ['Admin', 'Manager'] as UserRole[],
                allowedDepartments: ['Finance'],
              },
            },
            3: {
              value: 'draw | required | Admin,Manager | Finance',
              style: { color: '#9E9E9E', italic: true },
            },
          },

          // ── 12. UID Sequential ──
          12: {
            0: { value: 12, style: { align: 'center', color: '#9E9E9E' } },
            1: { value: 'Employee ID', style: { bold: true } },
            2: {
              value: null,
              inputConfig: {
                type: 'uid',
                label: 'EmployeeID',
                required: true,
                uidConfig: {
                  mode: 'sequential',
                  prefix: 'EMP-',
                  suffix: '',
                  startFrom: 1,
                },
                allowedRoles: ['Admin'] as UserRole[],
                allowedDepartments: ['HR'],
              },
            },
            3: {
              value: 'uid | sequential EMP-0001 | Admin | HR',
              style: { color: '#9E9E9E', italic: true },
            },
          },

          // ── 13. UID Manual ──
          13: {
            0: { value: 13, style: { align: 'center', color: '#9E9E9E' } },
            1: { value: 'Invoice No', style: { bold: true } },
            2: {
              value: null,
              inputConfig: {
                type: 'uid',
                label: 'InvoiceNo',
                required: true,
                uidConfig: {
                  mode: 'manual',
                  prefix: 'INV-',
                  suffix: '/2026',
                },
                allowedRoles: ['Admin', 'Manager'] as UserRole[],
              },
            },
            3: {
              value: 'uid | manual INV-____/2026 | Admin,Manager',
              style: { color: '#9E9E9E', italic: true },
            },
          },

          // ── 14. Notes (open to all) ──
          14: {
            0: { value: 14, style: { align: 'center', color: '#9E9E9E' } },
            1: { value: 'Notes', style: { bold: true } },
            2: {
              value: null,
              inputConfig: {
                type: 'text',
                label: 'Notes',
                placeholder: 'Additional notes...',
                required: false,
              },
            },
            3: {
              value: 'text | no access restriction',
              style: { color: '#9E9E9E', italic: true },
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
