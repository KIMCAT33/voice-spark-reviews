import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import tsconfigPaths from "vite-tsconfig-paths";

// Try to import lovable-tagger, but make it optional
let componentTagger: any = null;
try {
  const tagger = require("lovable-tagger");
  componentTagger = tagger.componentTagger;
} catch (e) {
  // lovable-tagger is optional
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
  if (mode === "development" && componentTagger) {
    plugins.push(componentTagger());
  }

  return {
    server: {
      host: "::",
      port: 8080,
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
