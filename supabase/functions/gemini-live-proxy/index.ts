// Gemini Live API WebSocket Proxy
// API 키를 서버 사이드에서만 관리하고 클라이언트에 노출하지 않음

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const { headers } = req;
  const upgradeHeader = headers.get("upgrade") || "";

  if (upgradeHeader.toLowerCase() !== "websocket") {
    return new Response("Expected WebSocket connection", { 
      status: 400,
      headers: corsHeaders 
    });
  }

  try {
    // Get Gemini API key from environment
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiApiKey) {
      console.error('❌ GEMINI_API_KEY not configured');
      return new Response(JSON.stringify({ error: 'API key not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate API key
    if (!geminiApiKey.trim()) {
      console.error('❌ GEMINI_API_KEY is empty');
      return new Response(JSON.stringify({ error: 'API key is empty' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('✅ [Gemini Proxy] API key loaded, length:', geminiApiKey.length);
    console.log('🔑 [Gemini Proxy] API key first 10 chars:', geminiApiKey.substring(0, 10) + '...');
    
    // Get model from query params (default: gemini-2.0-flash-exp)
    const url = new URL(req.url);
    const model = url.searchParams.get('model') || 'gemini-2.0-flash-exp';
    
    console.log('🔌 [Gemini Proxy] Establishing WebSocket connection');
    console.log('📱 [Gemini Proxy] Model:', model);

    // Upgrade client connection
    const { socket: clientSocket, response } = Deno.upgradeWebSocket(req);
    
    // Connect to Gemini Live API with API key in URL
    // The API key MUST be in the URL as a query parameter, not in the setup message
    const geminiWsUrl = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent?key=${encodeURIComponent(geminiApiKey)}`;
    console.log('🌐 [Gemini Proxy] Connecting to Gemini (URL length):', geminiWsUrl.length);
    console.log('🔐 [Gemini Proxy] Using API key in URL parameter');
    
    const geminiSocket = new WebSocket(geminiWsUrl);

    // Client -> Gemini: Forward messages
    clientSocket.onmessage = (event) => {
      try {
        if (geminiSocket.readyState === WebSocket.OPEN) {
          console.log('📤 [Gemini Proxy] Client -> Gemini:', typeof event.data, 'length:', event.data?.length);
          geminiSocket.send(event.data);
        } else {
          console.warn('⚠️ [Gemini Proxy] Gemini socket not ready, state:', geminiSocket.readyState);
        }
      } catch (error) {
        console.error('❌ [Gemini Proxy] Error forwarding to Gemini:', error);
      }
    };

    // Gemini -> Client: Forward messages
    geminiSocket.onmessage = (event) => {
      try {
        if (clientSocket.readyState === WebSocket.OPEN) {
          console.log('📥 [Gemini Proxy] Gemini -> Client:', typeof event.data, 'length:', event.data?.length);
          // Try to parse and log message type
          try {
            const parsed = JSON.parse(event.data);
            console.log('📋 [Gemini Proxy] Message type:', parsed.serverContent?.modelTurn?.parts?.[0] ? 'content' : parsed.setupComplete ? 'setupComplete' : 'unknown');
          } catch (e) {
            // Not JSON, skip parsing
          }
          clientSocket.send(event.data);
        } else {
          console.warn('⚠️ [Gemini Proxy] Client socket not ready');
        }
      } catch (error) {
        console.error('❌ [Gemini Proxy] Error forwarding to client:', error);
      }
    };

    // Handle Gemini connection open
    geminiSocket.onopen = () => {
      console.log('✅ [Gemini Proxy] Connected to Gemini Live API');
      
      // Send initial setup message with model configuration (NOT API key)
      const setupMessage = {
        setup: {
          model: `models/${model}`,
        }
      };
      console.log('📤 [Gemini Proxy] Sending setup message:', JSON.stringify(setupMessage));
      geminiSocket.send(JSON.stringify(setupMessage));
    };

    // Handle errors
    geminiSocket.onerror = (error) => {
      console.error('❌ [Gemini Proxy] Gemini socket error:', error);
      console.error('🔍 [Gemini Proxy] Error details:', {
        type: error.type,
        message: error instanceof ErrorEvent ? error.message : 'unknown',
        readyState: geminiSocket.readyState
      });
      if (clientSocket.readyState === WebSocket.OPEN) {
        clientSocket.close(1011, 'Upstream connection error');
      }
    };

    clientSocket.onerror = (error) => {
      console.error('❌ [Gemini Proxy] Client socket error:', error);
      console.error('🔍 [Gemini Proxy] Client error details:', {
        type: error.type,
        message: error instanceof ErrorEvent ? error.message : 'unknown',
        readyState: clientSocket.readyState
      });
      if (geminiSocket.readyState === WebSocket.OPEN) {
        geminiSocket.close();
      }
    };

    // Handle connection close
    geminiSocket.onclose = (event) => {
      console.log('🔌 [Gemini Proxy] Gemini connection closed');
      console.log('📊 [Gemini Proxy] Close details:', {
        code: event.code,
        reason: event.reason,
        wasClean: event.wasClean
      });
      if (clientSocket.readyState === WebSocket.OPEN) {
        clientSocket.close(event.code, event.reason);
      }
    };

    clientSocket.onclose = (event) => {
      console.log('🔌 [Gemini Proxy] Client connection closed');
      console.log('📊 [Gemini Proxy] Client close details:', {
        code: event.code,
        reason: event.reason,
        wasClean: event.wasClean
      });
      if (geminiSocket.readyState === WebSocket.OPEN) {
        geminiSocket.close();
      }
    };

    return response;
  } catch (error) {
    console.error('❌ [Gemini Proxy] Fatal error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
