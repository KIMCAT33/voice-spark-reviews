import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";
import tsconfigPaths from "vite-tsconfig-paths";

// Get __dirname equivalent for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Try to import lovable-tagger synchronously
function getComponentTagger() {
  try {
    const require = createRequire(import.meta.url);
    const tagger = require("lovable-tagger");
    return tagger?.componentTagger || null;
  } catch (e) {
    // lovable-tagger is optional - not available in all environments
    return null;
  }
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Vite uses VITE_ prefix by default, but we'll also support REACT_APP_ for compatibility
  const env = loadEnv(mode, process.cwd(), "");

  const plugins = [
    react(),
    tsconfigPaths({
      projects: ['./tsconfig.app.json']
    })
  ];
  
  // Only load component tagger in development
  if (mode === "development") {
    const componentTagger = getComponentTagger();
    if (componentTagger) {
      plugins.push(componentTagger());
    }
  }

  return {
    server: {
      // Lovable manages host/port, so use defaults unless specified
      host: process.env.VITE_HOST || "::",
      port: process.env.VITE_PORT ? parseInt(process.env.VITE_PORT) : 8080,
      https: mode === "development" ? false : undefined,
    },
    // Expose both VITE_ and REACT_APP_ prefixed env vars to client
    envPrefix: ["VITE_", "REACT_APP_"],
    plugins,
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    css: {
      preprocessorOptions: {
        scss: {
          // SCSS additional data can be added here if needed
        },
      },
    },
    define: {
      "process.env": {
        ...Object.keys(env).reduce((prev, key) => {
          // Support both VITE_ and REACT_APP_ prefixes
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
