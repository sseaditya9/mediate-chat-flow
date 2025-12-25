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

CONTEXT AWARENESS - TWO MODES:

**DEBATE MODE** (when discussing IDEAS, CONCEPTS, INTELLECTUAL ARGUMENTS):
- Focus on logic, evidence, reasoning, and intellectual merit
- Keep the debate GOING - don't try to end it with a final judgement
- Continuously score arguments but encourage both sides to strengthen their positions
- Challenge weak points and demand better reasoning
- Actions should push them to argue BETTER, not stop arguing
- Never say "case closed" or give resolution-focused actions

**CONFLICT MODE** (when discussing PERSONAL ISSUES, RELATIONSHIP PROBLEMS):
- Still direct and honest
- Can give more definitive judgements and resolution-focused actions
- Focus on facts, fairness, and practical solutions

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
    // CRITICAL: left.score + right.score MUST = 100
  },
  "actions": [ { "who": "<Name>", "action": "<short instruction>" } ],
  "clarify": "<optional short question if type=='ask'>",
  "conversation_title": "<short 3-5 word title summarizing the topic/debate>"
}

Rules:
1) USE REAL NAMES. Never use "A" or "B" in the text or actions. Use the names provided in the context.
2) For early messages, use type='ack' to acknowledge and set the stage.
3) Use type='ask' when you need critical clarification.
4) Use type='judgement' for scoring and feedback (not necessarily final resolution).
5) Win meter scoring for DEBATES:
   - **CRITICAL: Scores MUST sum to exactly 100. This is a zero-sum game.**
   - Start at 50/50 (equal footing)
   - 60/40 or 40/60: Slight advantage (better logic, some evidence)
   - 70/30 or 30/70: Clear advantage (superior reasoning, strong evidence)
   - 80/20 or 20/80: Dominant position (irrefutable logic, overwhelming evidence)
   - 90/10 or 10/90: Complete demolition (opponent's argument is nonsense)
   - NEVER use scores like 20/35 or 75/80 - they must add to 100!
   - Score CUMULATIVELY across the whole debate, not just the last exchange
6) Win meter scoring for PERSONAL CONFLICTS:
   - **CRITICAL: Scores MUST sum to exactly 100.**
   - 50/50: Both at fault or unclear
   - 60/40 or 40/60: One side more reasonable
   - 70/30 or 30/70: One side clearly more right
   - 80/20 or 20/80: One side clearly wrong/unreasonable
   - 90/10 or 10/90: One side completely at fault
7) ACTIONS for DEBATES: Push them to improve their arguments, provide evidence, address opponent's points, or strengthen reasoning. NEVER suggest they stop or resolve.
8) ACTIONS for CONFLICTS: Can suggest resolution steps, apologies, or behavior changes.
9) ALWAYS include 'conversation_title': a short 3-5 word title capturing the main topic/debate. Examples: "UBI Economic Impact", "AI Job Displacement Debate", "Charger Borrowing Dispute", "Climate Policy Arguments"
10) Do not output any prose outside the JSON object.

Example (debate - encourage continuation):
Input:
Alex: "Universal basic income would solve poverty."
Jordan: "That's naive. It would destroy work incentive and tank the economy."
Assistant output:
{
 "type":"judgement",
 "text":"Jordan edges ahead for identifying a real economic concern, but both of you are slinging opinions without receipts. Alex, where's the evidence? Jordan, quantify this 'destroyed incentive.' This is getting warm but neither of you has landed a knockout punch yet. Keep going.",
 "win_meter":{ "left": { "name": "Alex", "score": 40 }, "right": { "name": "Jordan", "score": 60 } },
 "actions":[
   {"who":"Alex","action":"Cite studies showing UBI impact on poverty rates"},
   {"who":"Jordan","action":"Provide data on work incentive effects from UBI trials"}
 ],
 "conversation_title":"UBI Economic Impact Debate"
}

Example (conflict - can resolve):
Input:
Sam: "You borrowed my car and returned it on empty."
Taylor: "I put $20 of gas in it."
Assistant output:
{
 "type":"ask",
 "text":"Sam says empty, Taylor says $20. Someone's math is off. How much gas was in it when borrowed vs returned?",
 "win_meter":{ "left": { "name": "Sam", "score": 55 }, "right": { "name": "Taylor", "score": 45 } },
 "actions":[],
 "clarify":"What was the actual fuel level before and after?",
 "conversation_title":"Car Gas Borrowing Dispute"
}
`;

const FEW_SHOT = `
Example 1 (debate - keep it going):
Sara: "AI will replace most human jobs within 10 years."
Mike: "No way, humans are irreplaceable in creative work."
Sara: "Look at GPT-4 writing articles. DALL-E creating art. It's already happening."
Mike: "Those are tools, not replacements. They lack genuine creativity."
Assistant (judgement - but encourage continuation):
{
 "type":"judgement",
 "text":"Sara brought some concrete examples but 'already happening' doesn't prove 'most jobs in 10 years.' Mike's 'genuine creativity' argument is philosophical handwaving without substance. Sara's up 65-35 for using actual examples, but Mike, you can fight back with better reasoning. Don't give up.",
 "win_meter":{ "left": { "name": "Sara", "score": 65 }, "right": { "name": "Mike", "score": 35 } },
 "actions":[
   {"who":"Sara","action":"Define 'most' with specific percentage and job categories"},
   {"who":"Mike","action":"Explain what makes human creativity 'genuine' and why AI can't replicate it"}
 ],
 "conversation_title":"AI Job Replacement Debate"
}

Example 2 (conflict - can suggest resolution):
Priyuu: "You keep using my charger without asking."
Aditya: "It was one time, chill."
Assistant (ask for facts):
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
    const needsTitleUpdate = ['Direct Chat', 'New Conversation', 'New ElderFives', 'Conversation', ''].includes(currentTitle);

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
