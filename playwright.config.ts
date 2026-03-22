import { createLovableConfig } from "lovable-agent-playwright-config/config";

export default createLovableConfig({
  // Custom configuration for FinFlow Pro
  use: {
    baseURL: 'http://localhost:5173', // Vite dev server
    headless: true,
  },
  timeout: 30000,
  expect: {
    timeout: 10000,
  },
  // Add your custom playwright configuration overrides here
});
