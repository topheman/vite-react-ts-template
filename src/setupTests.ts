import { afterEach } from "vitest";
import "@testing-library/jest-dom/vitest"; // Extend Vitest's expect
import { cleanup } from "@testing-library/react";

// Auto-clean between tests
afterEach(() => {
  cleanup();
});
