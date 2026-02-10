import { computed, type Ref } from 'vue'
import type { MergeRange } from '@/shared/types'

export interface MergeInfo {
  rowspan: number
  colspan: number
}

export const useMergeMap = (merges: Ref<MergeRange[]>) => {
  const spanMap = computed(() => {
    const spans = new Map<string, MergeInfo>()
    merges.value.forEach((merge) => {
      const key = `${merge.s.r},${merge.s.c}`
      spans.set(key, {
        rowspan: merge.e.r - merge.s.r + 1,
        colspan: merge.e.c - merge.s.c + 1,
      })
    })
    return spans
  })

  const skipMap = computed(() => {
    const skips = new Set<string>()
    merges.value.forEach((merge) => {
      for (let r = merge.s.r; r <= merge.e.r; r++) {
        for (let c = merge.s.c; c <= merge.e.c; c++) {
          if (r === merge.s.r && c === merge.s.c) continue
          skips.add(`${r},${c}`)
        }
      }
    })
    return skips
  })

  return { spanMap, skipMap }
}
