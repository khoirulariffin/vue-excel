<script setup lang="ts">
import type { ExcelShape } from '@/shared/types'
import { useThemeStore } from '@/features/theme/model/themeStore'

interface Props {
  shape: ExcelShape
}

defineProps<Props>()

const themeStore = useThemeStore()

const getStrokeDashArray = (dash?: string): string | undefined => {
  if (dash === 'dash') return '5,5'
  if (dash === 'dot') return '2,2'
  if (dash === 'dashDot') return '5,2,2,2'
  if (dash === 'sysDash') return '4,2'
  if (dash === 'sysDot') return '1,1'
  return undefined
}

const isLine = (shape: ExcelShape): boolean =>
  shape.shapeType === 'line' ||
  !!shape.shapeType?.toLowerCase().includes('connector') ||
  !!shape.shapeType?.includes('Arrow')

const getTextColor = (shape: ExcelShape) => {
  if (shape.textColor && shape.textColor !== '#000000') return shape.textColor
  return themeStore.theme === 'dark' ? '#e5e7eb' : '#000000'
}
</script>

<template>
  <!-- IMAGE -->
  <img
    v-if="shape.type === 'image' && shape.src"
    :src="shape.src"
    alt="shape"
    class="w-full h-full object-fill pointer-events-none select-none"
    draggable="false"
  />

  <!-- VECTOR SHAPE (SVG) -->
  <template v-if="shape.type === 'form'">
    <svg
      width="100%"
      height="100%"
      class="absolute inset-0 pointer-events-none"
      style="overflow: visible"
    >
      <!-- LINE / CONNECTOR -->
      <g v-if="isLine(shape)">
        <defs v-if="shape.shapeType?.includes('Arrow')">
          <marker
            :id="`arrowhead-${shape.id}`"
            markerWidth="10"
            markerHeight="7"
            refX="9"
            refY="3.5"
            orient="auto"
          >
            <polygon points="0 0, 10 3.5, 0 7" :fill="shape.stroke || 'transparent'" />
          </marker>
        </defs>
        <line
          :x1="shape.flipH ? shape.w : 0"
          :y1="shape.flipV ? shape.h : 0"
          :x2="shape.flipH ? 0 : shape.w"
          :y2="shape.flipV ? 0 : shape.h"
          :stroke="shape.stroke || 'transparent'"
          :stroke-width="shape.strokeWidth || 1"
          :stroke-dasharray="getStrokeDashArray(shape.strokeDash)"
          :marker-end="
            shape.shapeType?.includes('Arrow') ? `url(#arrowhead-${shape.id})` : undefined
          "
        />
      </g>

      <!-- TRIANGLE -->
      <polygon
        v-else-if="shape.shapeType === 'triangle'"
        :points="`${shape.w / 2},0 ${shape.w},${shape.h} 0,${shape.h}`"
        :fill="shape.fill || 'transparent'"
        :stroke="shape.stroke || 'transparent'"
        :stroke-width="shape.strokeWidth || 1"
        :stroke-dasharray="getStrokeDashArray(shape.strokeDash)"
      />

      <!-- ELLIPSE -->
      <ellipse
        v-else-if="shape.shapeType === 'ellipse'"
        :cx="shape.w / 2"
        :cy="shape.h / 2"
        :rx="shape.w / 2"
        :ry="shape.h / 2"
        :fill="shape.fill || 'transparent'"
        :stroke="shape.stroke || 'transparent'"
        :stroke-width="shape.strokeWidth || 1"
        :stroke-dasharray="getStrokeDashArray(shape.strokeDash)"
      />

      <!-- RECT / ROUNDRECT / DEFAULT -->
      <rect
        v-else
        x="0"
        y="0"
        :width="shape.w"
        :height="shape.h"
        :fill="shape.fill || 'transparent'"
        :stroke="shape.stroke || 'transparent'"
        :stroke-width="shape.strokeWidth || 1"
        :stroke-dasharray="getStrokeDashArray(shape.strokeDash)"
        :rx="shape.shapeType === 'roundRect' ? 10 : 0"
      />
    </svg>

    <!-- TEXT OVERLAY -->
    <div
      v-if="shape.text"
      class="absolute inset-0 pointer-events-none select-none"
      :style="{
        display: 'flex',
        alignItems:
          shape.textVertical === 'top'
            ? 'flex-start'
            : shape.textVertical === 'bottom'
              ? 'flex-end'
              : 'center',
        justifyContent:
          shape.textAlign === 'left'
            ? 'flex-start'
            : shape.textAlign === 'right'
              ? 'flex-end'
              : 'center',
        padding: '4px',
        color: getTextColor(shape),
        fontSize: `${shape.textSize || 11}pt`,
        fontWeight: shape.textBold ? 'bold' : 'normal',
        whiteSpace: 'pre-wrap',
        textAlign: shape.textAlign || 'center',
      }"
    >
      {{ shape.text }}
    </div>
  </template>
</template>
