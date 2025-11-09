import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const plugins: any[] = [react()];
  
  // Safely add lovable-tagger only in development
  if (mode === 'development') {
    try {
      const require = createRequire(import.meta.url);
      const tagger = require("lovable-tagger");
      if (tagger?.componentTagger) {
        plugins.push(tagger.componentTagger());
      }
    } catch {
      // lovable-tagger not available, skip it
    }
  }

  return {
    server: {
      host: "::",
      port: 8080,
    },
    plugins,
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    build: {
      outDir: "build",
    },
  };
});
