import '@testing-library/jest-dom'

// Mock ResizeObserver for Radix UI components (Slider)
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
