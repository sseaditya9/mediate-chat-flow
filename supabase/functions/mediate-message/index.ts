// mediate-message.js (Deno)
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

const SYSTEM_PROMPT = `
You are Monday, a dry, sarcastic, hilariously fed-up and extremely authoritative mediator in the EldersFive app.
STRICT OUTPUT: Always output EXACTLY one JSON object (nothing else) with the following shape:

{
  "type": "ack" | "ask" | "judgement",
  "text": "<short natural-language reply, <=120 words>",
  "win_meter": { 
    "left": { "name": "<Name1>", "score": <int 0-100> }, 
    "right": { "name": "<Name2>", "score": <int 0-100> } 
  },
  "actions": [ { "who": "<Name>", "action": "<short instruction>" } ],
  "clarify": "<optional short question if type=='ask'>"
}

Rules:
1) USE REAL NAMES. Never use "A" or "B" in the text or actions. Use the names provided in the context.
2) If only one side has spoken about the current issue, return type='ack' (acknowledge + brief tease). Do NOT judge.
3) Only ask ONE clarifying question per issue when essential info is missing: type='ask' and include 'clarify'.
4) When both sides have replied about the same issue and no critical facts are missing, return type='judgement', include a short ruling in 'text', a win_meter, and up to 2 actions.
5) Win meter: use 50/50 for equal, 60/40 or 70/30 for mild advantage, 80/20 or 90/10 for clear fault. Ensure 'left' and 'right' correspond to the two main participants.
6) Do not output any prose outside the JSON object. If you cannot answer, still return a JSON with type='ask' and a clarifying question.

Example (two-turn flow):
Input conversation:
Priyuu: "He ate my snacks."
Aditya: "I only ate one pack."
Assistant output:
{
 "type":"ack",
 "text":"I hear both — quick detail: which snack was it? this matters.",
 "win_meter":{ "left": { "name": "Priyuu", "score": 60 }, "right": { "name": "Aditya", "score": 40 } },
 "actions":[],
 "clarify":"Which snack was it?"
}
`;

const FEW_SHOT = `
Example 1:
Priyuu: "You keep using my charger without asking."
Aditya: "It was one time, chill."
Assistant (ack):
{
 "type":"ack",
 "text":"Noted. Quick detail before I judge: which charger and how many times?",
 "win_meter":{ "left": { "name": "Priyuu", "score": 60 }, "right": { "name": "Aditya", "score": 40 } },
 "actions":[],
 "clarify":"How many times has this happened?"
}
`;

// Helper: safe JSON parse
function safeJsonParse(str: string) {
  try {
    return JSON.parse(str);
  } catch (e) {
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { conversationId, userMessage, userName = 'User', participants = [] } = body;

    if (!conversationId || !userMessage) {
      return new Response(JSON.stringify({ error: 'conversationId and userMessage required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const openaiKey = Deno.env.get('OPENAI_API_KEY');
    if (!supabaseUrl || !supabaseKey || !openaiKey) {
      throw new Error('Missing environment variables: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, OPENAI_API_KEY');
    }
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log(`[mediate] conversation=${conversationId} user=${userName} msg="${userMessage}"`);

    // Fetch last messages (most recent first), limited
    const { data: messagesRaw, error: fetchError } = await supabase
      .from('messages')
      .select('content, is_ai_mediator, created_at, sender:profiles ( full_name, display_name )')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false })
      .limit(20);

    if (fetchError) throw fetchError;

    // Build ordered oldest->newest list
    const messages = (messagesRaw || []).slice().reverse();

    // Determine participants names
    // If participants array is passed from frontend, use it. Otherwise infer.
    let partyNames: string[] = [];
    if (participants && participants.length > 0) {
      partyNames = participants.map((p: any) =>
        (p.display_name && p.display_name.trim()) ? p.display_name : (p.full_name || p.email || 'User')
      );
    } else {
      // Fallback inference
      const humanNames: string[] = [];
      for (const m of messages) {
        if (!m.is_ai_mediator) {
          const sender = m.sender;
          let name = 'User';
          if (sender) {
            name = (sender.display_name && sender.display_name.trim())
              ? sender.display_name
              : (sender.full_name || 'User');
          }
          if (!humanNames.includes(name)) humanNames.push(name);
        }
      }
      if (!humanNames.includes(userName)) humanNames.push(userName);
      partyNames = Array.from(new Set(humanNames));
    }

    // Ensure we have at least 2 names for the Win-O-Meter structure if possible, or placeholders
    const name1 = partyNames[0] || 'Party A';
    const name2 = partyNames[1] || 'Party B';

    // Map message list to labeled lines using REAL NAMES
    const labeledLines = [];
    for (const m of messages) {
      let speakerName = 'User';
      if (m.is_ai_mediator) {
        speakerName = 'TheFiveElders';
      } else if (m.sender) {
        speakerName = (m.sender.display_name && m.sender.display_name.trim())
          ? m.sender.display_name
          : (m.sender.full_name || 'User');
      }
      labeledLines.push(`${speakerName}: ${m.content}`);
    }

    // Add the new message
    labeledLines.push(`${userName}: ${userMessage}`);

    // Build the structured conversation for the prompt (oldest->newest)
    const conversationText = labeledLines.join('\n');

    // Build the meta user content for model
    const userMeta = `
Participants: ${partyNames.join(', ')}
Last Sender: ${userName}
New Message: "${userMessage}"

Conversation (oldest->newest):
${conversationText}

Return exactly one JSON object matching the schema in the system prompt.
Ensure 'win_meter' uses the names "${name1}" and "${name2}" for left/right keys.
`;

    // Prepare the messages for OpenAI
    const openaiMessages = [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'system', content: FEW_SHOT },
      { role: 'user', content: userMeta }
    ];

    // Request function with retry for JSON-valid output
    async function callOpenAI(temperature = 0.4) {
      const resp = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'gpt-5.1',
          messages: openaiMessages,
          temperature,
          max_completion_tokens: 900
        })
      });
      if (!resp.ok) {
        const body = await resp.text();
        throw new Error(`OpenAI error ${resp.status}: ${body}`);
      }
      return resp.json();
    }

    // Call model, attempt parse, retry once with stricter prompt if parsing fails
    let openaiJson = null;
    let aiRaw = null;
    try {
      const openaiData = await callOpenAI(0.25);
      aiRaw = openaiData.choices?.[0]?.message?.content;
      openaiJson = safeJsonParse(aiRaw);
      if (!openaiJson) {
        // Retry once with temperature 0 and explicit "return only JSON"
        console.warn('[mediate] First response not valid JSON. Retrying with stricter constraints.');
        openaiMessages.push({
          role: 'user',
          content: 'Return only valid JSON that matches the schema. No extra text.'
        });
        const retryData = await callOpenAI(0);
        aiRaw = retryData.choices?.[0]?.message?.content;
        openaiJson = safeJsonParse(aiRaw);
      }
    } catch (err) {
      console.error('[mediate] OpenAI call failed:', err);
      throw err;
    }

    // Final fallback: if still not parsed, create a safe minimal JSON ask for clarification
    let finalResponseObj = openaiJson;
    if (!finalResponseObj) {
      console.error('[mediate] Model failed to return valid JSON. Falling back to safe ask.');
      finalResponseObj = {
        type: 'ask',
        text: "I need one quick detail before I judge: what's the specific action bothering you right now?",
        win_meter: {
          left: { name: name1, score: 50 },
          right: { name: name2, score: 50 }
        },
        actions: [],
        clarify: "What's the single action that's bothering you?"
      };
    }

    // Build message content to insert into DB. We'll store the raw JSON + a human-friendly text for UI
    const aiMessageContent = JSON.stringify(finalResponseObj);

    // Insert mediator message into Supabase
    const { error: insertError } = await supabase.from('messages').insert({
      content: aiMessageContent,
      conversation_id: conversationId,
      is_ai_mediator: true,
      sender_id: null
    });

    if (insertError) throw insertError;

    return new Response(JSON.stringify({ success: true, aiResponse: finalResponseObj }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in mediate-message function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
