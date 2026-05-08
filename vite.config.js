import { defineConfig } from "vite";
// import reactRefresh from "@vitejs/plugin-react-refresh";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const BASE_URL = process.env.BASE_URL;
  const PORT = parseInt(process.env.PORT) || 3000;
  
  return {
    plugins: [
      react()
    ],
    build: {
      minify: mode === "production" ? "esbuild" : false,
      esbuild: {
        drop: ["console", "debugger"],
        legalComments: "none"
      },
      sourcemap: false,
      rollupOptions: {
        output: {
          compact: true
        }
      }
    },
    server: {
      host: "0.0.0.0",
      port: PORT,
      headers: {
        "X-Content-Type-Options": "nosniff",
        "X-Frame-Options": "SAMEORIGIN",
        "X-XSS-Protection": "1; mode=block",
        "Referrer-Policy": "strict-origin-when-cross-origin",
        "Content-Security-Policy": "default-src 'self' 'unsafe-inline' 'unsafe-eval'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' ws: wss: http: https:;"
      }
    },
    test: {
      environment: "jsdom",
      setupFiles: "./src/setupTests.js",
      passWithNoTests: true,
      reporters: "default",
      coverage: {
        provider: "v8",
        reportsDirectory: "./coverage",
        reporter: ["text", "lcov"],
      },
    }
  };
});
