import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";
import { fileURLToPath } from "node:url";

export default defineConfig({
    plugins: [tsconfigPaths()],

    resolve: {
        alias: {
            "@": fileURLToPath(new URL("./src", import.meta.url)),
            "server-only": fileURLToPath(
                new URL("./test/server-only.ts", import.meta.url)
            ),
        },
    },

    test: {
        environment: "jsdom",
        setupFiles: ["./vitest.setup.ts"],
        restoreMocks: true,
        clearMocks: true,
    },
});
