import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/**/*.test.{js,ts,tsx}"],
    // describe/test/expect/vi without imports, as the tests were written for Jest
    globals: true,
    environment: "node",
  },
});
