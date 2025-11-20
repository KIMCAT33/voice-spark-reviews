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
    const geminiWsUrl = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent?key=${encodeURIComponent(geminiApiKey)}`;
    console.log('🌐 [Gemini Proxy] Connecting to Gemini');
    console.log('🔐 [Gemini Proxy] API key in URL: YES');
    console.log('🔗 [Gemini Proxy] Full URL (censored):', geminiWsUrl.replace(geminiApiKey, 'CENSORED'));
    
    const geminiSocket = new WebSocket(geminiWsUrl);
    
    // Message buffer for client messages before Gemini is ready
    let messageBuffer: string[] = [];

    // Client -> Gemini: Forward messages (with buffering)
    clientSocket.onmessage = (event) => {
      try {
        const preview = event.data.substring(0, 100);
        console.log('📨 [Gemini Proxy] Received from client (len:', event.data.length, '):', preview, '...');
        console.log('🔍 [Gemini Proxy] Gemini readyState:', geminiSocket.readyState, '(0=CONNECTING, 1=OPEN, 2=CLOSING, 3=CLOSED)');
        
        if (geminiSocket.readyState === WebSocket.OPEN) {
          console.log('✅ [Gemini Proxy] Forwarding to Gemini immediately');
          geminiSocket.send(event.data);
        } else {
          console.log('📦 [Gemini Proxy] Buffering message, current buffer size:', messageBuffer.length);
          messageBuffer.push(event.data);
        }
      } catch (error) {
        console.error('❌ [Gemini Proxy] Error in client message handler:', error);
      }
    };

    // Gemini -> Client: Forward messages
    geminiSocket.onmessage = (event) => {
      try {
        const preview = event.data.substring(0, 100);
        console.log('📥 [Gemini Proxy] Received from Gemini (len:', event.data.length, '):', preview, '...');
        console.log('🔍 [Gemini Proxy] Client readyState:', clientSocket.readyState);
        
        // Try to parse and log message type
        try {
          const parsed = JSON.parse(event.data);
          const msgType = parsed.setupComplete ? 'setupComplete' : 
                         parsed.serverContent ? 'content' : 
                         parsed.toolCall ? 'toolCall' : 
                         Object.keys(parsed)[0];
          console.log('📋 [Gemini Proxy] Message type:', msgType);
          if (parsed.setupComplete) {
            console.log('✅ [Gemini Proxy] Setup completed successfully!');
          }
        } catch (e) {
          console.log('📋 [Gemini Proxy] Non-JSON message');
        }
        
        if (clientSocket.readyState === WebSocket.OPEN) {
          console.log('✅ [Gemini Proxy] Forwarding to client');
          clientSocket.send(event.data);
        } else {
          console.warn('⚠️ [Gemini Proxy] Client socket not ready, dropping message');
        }
      } catch (error) {
        console.error('❌ [Gemini Proxy] Error in Gemini message handler:', error);
      }
    };

    // Handle Gemini connection open
    geminiSocket.onopen = () => {
      console.log('✅ [Gemini Proxy] Gemini WebSocket OPEN');
      console.log('📦 [Gemini Proxy] Flushing', messageBuffer.length, 'buffered messages');
      
      // Send all buffered messages
      for (let i = 0; i < messageBuffer.length; i++) {
        try {
          const msg = messageBuffer[i];
          const preview = msg.substring(0, 100);
          console.log(`📤 [Gemini Proxy] Sending buffered message ${i+1}/${messageBuffer.length}:`, preview, '...');
          geminiSocket.send(msg);
        } catch (error) {
          console.error('❌ [Gemini Proxy] Error sending buffered message:', error);
        }
      }
      messageBuffer = [];
      console.log('✅ [Gemini Proxy] All buffered messages sent');
    };

    // Handle errors
    geminiSocket.onerror = (error) => {
      console.error('❌ [Gemini Proxy] Gemini socket error');
      console.error('🔍 [Gemini Proxy] Error details:', {
        type: error.type,
        message: error instanceof ErrorEvent ? error.message : 'unknown',
        readyState: geminiSocket.readyState,
        bufferedMessages: messageBuffer.length
      });
      if (clientSocket.readyState === WebSocket.OPEN) {
        console.log('🔌 [Gemini Proxy] Closing client socket due to Gemini error');
        clientSocket.close(1011, 'Upstream connection error');
      }
    };

    clientSocket.onerror = (error) => {
      console.error('❌ [Gemini Proxy] Client socket error');
      console.error('🔍 [Gemini Proxy] Client error details:', {
        type: error.type,
        message: error instanceof ErrorEvent ? error.message : 'unknown',
        readyState: clientSocket.readyState,
        bufferedMessages: messageBuffer.length
      });
      if (geminiSocket.readyState === WebSocket.OPEN) {
        console.log('🔌 [Gemini Proxy] Closing Gemini socket due to client error');
        geminiSocket.close();
      }
    };

    // Handle connection close
    geminiSocket.onclose = (event) => {
      console.log('🔌 [Gemini Proxy] Gemini connection closed');
      console.log('📊 [Gemini Proxy] Close details:', {
        code: event.code,
        reason: event.reason,
        wasClean: event.wasClean,
        bufferedMessages: messageBuffer.length
      });
      if (event.code === 1007) {
        console.error('🔑 [Gemini Proxy] Authentication failed - API key rejected by Gemini');
      }
      if (clientSocket.readyState === WebSocket.OPEN) {
        console.log('🔌 [Gemini Proxy] Closing client socket');
        clientSocket.close(event.code, event.reason);
      }
    };

    clientSocket.onclose = (event) => {
      console.log('🔌 [Gemini Proxy] Client connection closed');
      console.log('📊 [Gemini Proxy] Client close details:', {
        code: event.code,
        reason: event.reason,
        wasClean: event.wasClean,
        bufferedMessages: messageBuffer.length
      });
      if (geminiSocket.readyState === WebSocket.OPEN) {
        console.log('🔌 [Gemini Proxy] Closing Gemini socket');
        geminiSocket.close();
      }
    };

    return response;
  } catch (error) {
    console.error('❌ [Gemini Proxy] Fatal error:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : String(error)
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

