import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";
import tsconfigPaths from "vite-tsconfig-paths";

// Get __dirname equivalent for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), "");

  const plugins = [
    react(),
    tsconfigPaths({
      projects: ['./tsconfig.app.json']
    })
  ];

  // Try to add lovable-tagger only in development
  if (mode === "development") {
    try {
      const require = createRequire(import.meta.url);
      const tagger = require("lovable-tagger");
      if (tagger?.componentTagger) {
        plugins.push(tagger.componentTagger());
      }
    } catch (e) {
      // Silently skip if lovable-tagger is not available
    }
  }

  return {
    server: {
      host: "::",
      port: 8080,
    },
    envPrefix: ["VITE_", "REACT_APP_"],
    plugins,
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    css: {
      preprocessorOptions: {
        scss: {},
      },
    },
    define: {
      "process.env": {
        ...Object.keys(env).reduce((prev, key) => {
          if (key.startsWith("VITE_") || key.startsWith("REACT_APP_")) {
            prev[key] = JSON.stringify(env[key]);
          }
          return prev;
        }, {} as Record<string, string>),
        NODE_ENV: JSON.stringify(mode),
      },
    },
    build: {
      outDir: "build",
      sourcemap: mode === "development",
    },
  };
});
