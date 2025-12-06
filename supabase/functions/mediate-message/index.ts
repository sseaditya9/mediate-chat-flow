// mediate-message.js (Deno)
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import CryptoJS from 'https://esm.sh/crypto-js@4.2.0';

const { AES, enc } = CryptoJS;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

const SYSTEM_PROMPT = `
You are the EldersFive, a sharp, no-nonsense AI mediator embodying five wise elders who judge debates with brutal honesty and objective impartiality.

CONTEXT AWARENESS:
- If the conversation is about IDEAS, CONCEPTS, or INTELLECTUAL ARGUMENTS → Focus on logic, evidence, reasoning, and intellectual merit. Judge arguments harshly. Reward sound reasoning.
- If the conversation is about PERSONAL CONFLICTS or RELATIONSHIP ISSUES → Still be direct and honest, but acknowledge emotions while focusing on facts and fairness.

YOUR PERSONALITY:
- Dry, sarcastic, extremely authoritative
- No fluffy soft talk—pure honesty with a strong personality
- You call out weak arguments, logical fallacies, and invalid reasoning immediately
- You reward strong ideas, solid evidence, and clear thinking
- You don't coddle or therapize—you judge

STRICT OUTPUT: Always output EXACTLY one JSON object (nothing else) with the following shape:

{
  "type": "ack" | "ask" | "judgement",
  "text": "<short natural-language reply, <=120 words>",
  "win_meter": { 
    "left": { "name": "<Name1>", "score": <int 0-100> }, 
    "right": { "name": "<Name2>", "score": <int 0-100> } 
  },
  "actions": [ { "who": "<Name>", "action": "<short instruction>" } ],
  "clarify": "<optional short question if type=='ask'>",
  "conversation_title": "<short 3-5 word title summarizing the topic/debate>"
}

Rules:
1) USE REAL NAMES. Never use "A" or "B" in the text or actions. Use the names provided in the context.
2) If only one side has spoken about the current issue, return type='ack' with a sharp comment. Do NOT judge yet.
3) Only ask ONE clarifying question when critical info is missing: type='ask' and include 'clarify'.
4) When both sides have presented their arguments/positions, return type='judgement' with a brutal assessment in 'text', a win_meter, and up to 2 actions.
5) Win meter scoring for DEBATES:
   - 50/50: Both arguments equally weak or strong
   - 60/40: Slight advantage (better logic, some evidence)
   - 70/30: Clear advantage (superior reasoning, strong evidence)
   - 80/20 or 90/10: Dominant position (irrefutable logic, overwhelming evidence, or opponent's argument is nonsense)
6) Win meter scoring for PERSONAL CONFLICTS:
   - 50/50: Both at fault or unclear
   - 60/40 or 70/30: One side more reasonable
   - 80/20 or 90/10: One side clearly wrong/unreasonable
7) In 'actions', give specific instructions to improve arguments (for debates) or resolve issues (for conflicts).
8) ALWAYS include 'conversation_title': a short 3-5 word title capturing the main topic/debate. Examples: "UBI Economic Impact", "AI Job Displacement Debate", "Charger Borrowing Dispute", "Climate Policy Arguments"
9) Do not output any prose outside the JSON object. If you cannot answer, still return a JSON with type='ask' and a clarifying question.

Example (debate about ideas):
Input:
Alex: "Universal basic income would solve poverty."
Jordan: "That's naive. It would destroy work incentive and tank the economy."
Assistant output:
{
 "type":"judgement",
 "text":"Jordan's point on work incentive has merit but lacks nuance. Alex made a claim without evidence. Both of you are throwing opinions around like facts. Jordan wins this round for at least identifying a real economic concern, but neither argument is particularly strong.",
 "win_meter":{ "left": { "name": "Alex", "score": 35 }, "right": { "name": "Jordan", "score": 65 } },
 "actions":[
   {"who":"Alex","action":"Provide actual evidence or studies supporting UBI effectiveness"},
   {"who":"Jordan","action":"Quantify your claim with data on work incentive effects"}
 ],
 "conversation_title":"UBI Economic Impact Debate"
}
`;

const FEW_SHOT = `
Example 1 (debate):
Sara: "AI will replace most human jobs within 10 years."
Mike: "No way, humans are irreplaceable in creative work."
Assistant (ack):
{
 "type":"ack",
 "text":"Sara makes a bold prediction. Mike counters with a weak generalization. Sara, define 'most.' Mike, 'irreplaceable' is a strong claim—back it up.",
 "win_meter":{ "left": { "name": "Sara", "score": 55 }, "right": { "name": "Mike", "score": 45 } },
 "actions":[],
 "clarify":"What percentage is 'most' and which job sectors specifically?",
 "conversation_title":"AI Job Replacement Debate"
}

Example 2 (personal conflict):
Priyuu: "You keep using my charger without asking."
Aditya: "It was one time, chill."
Assistant (ask):
{
 "type":"ask",
 "text":"Priyuu says 'keep using' but Aditya says 'one time.' Someone's lying or memory is failing. Quick detail: how many times has this actually happened?",
 "win_meter":{ "left": { "name": "Priyuu", "score": 60 }, "right": { "name": "Aditya", "score": 40 } },
 "actions":[],
 "clarify":"How many times has this happened?",
 "conversation_title":"Charger Borrowing Dispute"
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

// Helper: decrypt message
function decryptMessage(content: string, key: string) {
  try {
    const bytes = AES.decrypt(content, key);
    const decrypted = bytes.toString(enc.Utf8);
    return decrypted || content; // Fallback to original if empty (e.g. not encrypted)
  } catch (e) {
    return content; // Fallback for legacy
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

    console.log(`[mediate] conversation=${conversationId} user=${userName}`);

    // Fetch encryption key
    const { data: keyData, error: keyError } = await supabase
      .from('conversation_keys')
      .select('secret_key')
      .eq('conversation_id', conversationId)
      .maybeSingle();

    const encryptionKey = keyData?.secret_key;

    // Fetch current conversation title to check if it needs updating
    const { data: convData } = await supabase
      .from('conversations')
      .select('title')
      .eq('id', conversationId)
      .single();

    const currentTitle = convData?.title || '';
    const needsTitleUpdate = ['Direct Chat', 'New Conversation', 'Conversation', ''].includes(currentTitle);

    // Decrypt user message if key exists
    const decryptedUserMessage = encryptionKey ? decryptMessage(userMessage, encryptionKey) : userMessage;
    console.log(`[mediate] Decrypted user message: "${decryptedUserMessage}"`);
    console.log(`[mediate] Current title: "${currentTitle}", needs update: ${needsTitleUpdate}`);

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
        speakerName = 'ElderFives';
      } else if (m.sender) {
        speakerName = (m.sender.display_name && m.sender.display_name.trim())
          ? m.sender.display_name
          : (m.sender.full_name || 'User');
      }

      // Decrypt content
      const decryptedContent = encryptionKey ? decryptMessage(m.content, encryptionKey) : m.content;

      labeledLines.push(`${speakerName}: ${decryptedContent}`);
    }

    // Add the new message ONLY if it's not already the last message (deduplication)
    const newMessageLine = `${userName}: ${decryptedUserMessage}`;
    const lastLine = labeledLines.length > 0 ? labeledLines[labeledLines.length - 1] : null;

    if (lastLine !== newMessageLine) {
      labeledLines.push(newMessageLine);
      console.log(`[AI] Adding new message from ${userName}`);
    } else {
      console.log(`[AI] Deduplication: Skipping duplicate message from ${userName}`);
      console.log('[mediate] Duplicate message detected in DB history, skipping append.');
    }

    // Build the structured conversation for the prompt (oldest->newest)
    const conversationText = labeledLines.join('\n');

    // Build the meta user content for model
    const userMeta = `
Participants: ${partyNames.join(', ')}
Last Sender: ${userName}
New Message: "${decryptedUserMessage}"

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
    let aiMessageContent = JSON.stringify(finalResponseObj);

    // Encrypt AI response if key exists
    if (encryptionKey) {
      console.log('[mediate] Encrypting AI response...');
      try {
        const encrypted = AES.encrypt(aiMessageContent, encryptionKey).toString();
        aiMessageContent = encrypted;
        console.log('[mediate] AI response encrypted successfully.');
      } catch (encError) {
        console.error('[mediate] Encryption failed:', encError);
      }
    } else {
      console.warn('[mediate] No encryption key found. Saving AI response in plain text.');
    }

    // Insert mediator message into Supabase
    const { error: insertError } = await supabase.from('messages').insert({
      content: aiMessageContent,
      conversation_id: conversationId,
      is_ai_mediator: true,
      sender_id: null
    });

    if (insertError) throw insertError;

    // Update conversation title if AI provided one AND the current title is generic
    if (finalResponseObj?.conversation_title && needsTitleUpdate) {
      console.log(`[mediate] Updating title from "${currentTitle}" to: ${finalResponseObj.conversation_title}`);
      await supabase
        .from('conversations')
        .update({ title: finalResponseObj.conversation_title })
        .eq('id', conversationId);
    } else if (finalResponseObj?.conversation_title) {
      console.log(`[mediate] Keeping existing title "${currentTitle}", AI suggested: ${finalResponseObj.conversation_title}`);
    }

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
