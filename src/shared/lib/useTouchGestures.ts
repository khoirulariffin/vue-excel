import { ref } from 'vue'

/**
 * Converts a TouchEvent to a MouseEvent-like object with clientX/clientY.
 */
export const touchToMouseCoords = (e: TouchEvent): { clientX: number; clientY: number } => {
  const touch = e.touches[0] ?? e.changedTouches[0]
  if (!touch) return { clientX: 0, clientY: 0 }
  return { clientX: touch.clientX, clientY: touch.clientY }
}

/**
 * Composable for detecting tap and double-tap gestures on touch devices.
 * - `onTap` fires on single tap (after a short delay to distinguish from double-tap).
 * - `onDoubleTap` fires on double-tap.
 * - If `immediateOnTap` is true, tap fires immediately (no delay).
 */
export const useTouchGestures = (options?: { immediateOnTap?: boolean }) => {
  const lastTapTime = ref(0)
  const tapTimeout = ref<ReturnType<typeof setTimeout> | null>(null)
  const DOUBLE_TAP_DELAY = 300

  const handleTouchEnd = (
    e: TouchEvent,
    onTap?: (e: TouchEvent) => void,
    onDoubleTap?: (e: TouchEvent) => void,
  ) => {
    const now = Date.now()
    const timeSinceLastTap = now - lastTapTime.value

    if (timeSinceLastTap < DOUBLE_TAP_DELAY && timeSinceLastTap > 0) {
      // Double tap detected
      if (tapTimeout.value) {
        clearTimeout(tapTimeout.value)
        tapTimeout.value = null
      }
      lastTapTime.value = 0
      onDoubleTap?.(e)
    } else {
      lastTapTime.value = now
      if (options?.immediateOnTap) {
        onTap?.(e)
      } else {
        tapTimeout.value = setTimeout(() => {
          onTap?.(e)
          tapTimeout.value = null
        }, DOUBLE_TAP_DELAY)
      }
    }
  }

  const cleanup = () => {
    if (tapTimeout.value) {
      clearTimeout(tapTimeout.value)
      tapTimeout.value = null
    }
  }

  return { handleTouchEnd, cleanup }
}
