import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { fileURLToPath } from "url";
import { componentTagger } from "lovable-tagger";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // 러버블 빌드 환경에서 환경 변수를 명시적으로 로드
  // loadEnv는 .env 파일과 process.env에서 환경 변수를 읽어옵니다
  // 러버블 Secrets가 process.env로 주입되면 여기서 읽을 수 있습니다
  const env = loadEnv(mode, process.cwd(), '');
  
  // 러버블 빌드 환경에서 환경 변수 디버깅 (빌드 타임에만 출력)
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
    // 러버블 Secrets를 Vite 환경 변수로 명시적으로 매핑
    // 러버블이 process.env로 주입하는 경우를 대비하여 명시적으로 처리
    define: {
      // import.meta.env.VITE_GEMINI_API_KEY는 loadEnv에서 자동으로 처리되지만,
      // 러버블이 process.env로만 주입하는 경우를 대비하여 명시적으로 매핑
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
