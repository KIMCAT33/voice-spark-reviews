import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { fileURLToPath } from "url";
import { componentTagger } from "lovable-tagger";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Lovable Secrets를 환경 변수로 로드
  // loadEnv는 로컬 .env 파일(있다면)과 process.env에서 환경 변수를 읽음
  // Lovable 빌드 환경에서는 Secrets가 자동으로 process.env에 주입됨
  const env = loadEnv(mode, process.cwd(), '');
  
  // 빌드 환경에서 Lovable Secrets 디버깅 (빌드 타임에만 출력)
  if (mode === 'production') {
    const hasGeminiKey = !!(env.VITE_GEMINI_API_KEY || env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY);
    const hasOpenAIKey = !!(env.VITE_OPENAI_API_KEY || env.OPENAI_API_KEY || process.env.VITE_OPENAI_API_KEY || process.env.OPENAI_API_KEY);
    
    if (!hasGeminiKey || !hasOpenAIKey) {
      console.warn('⚠️ [Vite Build] API Keys not found in environment variables');
      console.warn('Available env keys:', Object.keys(env).filter(k => k.includes('GEMINI') || k.includes('OPENAI') || k.includes('VITE_')).slice(0, 10));
      console.warn('Available process.env keys:', Object.keys(process.env).filter(k => k.includes('GEMINI') || k.includes('OPENAI') || k.includes('VITE_')).slice(0, 10));
    }
  }
  
  return {
    server: {
      host: "::",
      port: 8080,
    },
    plugins: [
      react(),
      mode === 'development' && componentTagger(),
    ].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    build: {
      outDir: "dist",
      sourcemap: true,
    },
    // Lovable Secrets를 Vite 환경 변수로 명시적으로 매핑
    // Lovable이 빌드 시 process.env로 Secrets를 주입함
    define: {
      // import.meta.env.VITE_GEMINI_API_KEY를 빌드 타임에 주입
      // 로컬 .env 파일 또는 Lovable Secrets(process.env)에서 읽음
      'import.meta.env.VITE_GEMINI_API_KEY': JSON.stringify(
        env.VITE_GEMINI_API_KEY || 
        env.GEMINI_API_KEY || 
        process.env.VITE_GEMINI_API_KEY || 
        process.env.GEMINI_API_KEY || 
        ''
      ),
      'import.meta.env.VITE_OPENAI_API_KEY': JSON.stringify(
        env.VITE_OPENAI_API_KEY || 
        env.OPENAI_API_KEY || 
        process.env.VITE_OPENAI_API_KEY || 
        process.env.OPENAI_API_KEY || 
        ''
      ),
    },
  };
});
