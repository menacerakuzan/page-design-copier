import "@testing-library/jest-dom";
import { afterAll, afterEach, beforeAll } from "vitest";
import { server } from "./msw/server";
import { resetMsw } from "./msw/handlers";

// Mock Service Worker — intercepts PostgREST/storage HTTP for the whole suite.
beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => {
  server.resetHandlers();
  resetMsw();
});
afterAll(() => server.close());

// jsdom lacks these browser APIs that framer-motion / UI components touch.
class MockObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return [];
  }
}
(globalThis as any).IntersectionObserver ??= MockObserver;
(globalThis as any).ResizeObserver ??= MockObserver;
// jsdom defines scrollTo as a throwing stub — replace it with a no-op.
(window as any).scrollTo = () => {};

// jsdom lacks these; TipTap/ProseMirror (rich-text editor) calls them.
if (!document.elementFromPoint) {
  (document as any).elementFromPoint = () => null;
}
if (!Range.prototype.getClientRects) {
  (Range.prototype as any).getClientRects = () => ({ length: 0, item: () => null, [Symbol.iterator]: function* () {} });
  (Range.prototype as any).getBoundingClientRect = () => ({ x: 0, y: 0, width: 0, height: 0, top: 0, left: 0, right: 0, bottom: 0 });
}

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }),
});
