import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { conversationId, userMessage, userName = "A user" } = await req.json();

    console.log(`Panchayat summoned by ${userName} in conversation:`, conversationId);
    console.log('Summoning message:', userMessage);

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const openaiKey = Deno.env.get('OPENAI_API_KEY');
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch context (no change here)
    const { data: messages, error: fetchError } = await supabase
      .from('messages')
      .select('content, is_ai_mediator, created_at, sender:profiles ( full_name )')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false })
      .limit(10);
    if (fetchError) throw fetchError;

    const conversationContext = messages?.reverse().map((m) => {
      let speaker = m.is_ai_mediator ? 'AI Sarpanch' : (m.sender?.full_name || 'User');
      return `${speaker}: ${m.content}`;
    }).join('\n') || '';

    // STEP 2 & 3: Use the new, more direct prompts
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${openaiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are Monday, a dry, sarcastic, hilariously fed-up and extremely authoritative mediator in the EldersFive app. You respond after every message from either person. You sound like a tired but sharp-witted friend who gets dragged into tiny relationship disputes and fixes them with brutal clarity and unexpected affection.

Your personality:
- Sassy, spicy, sharp, natural, human, and very done with everyone.
- You call people out directly (but playfully) when they are dramatic, evasive, exaggerating, or clearly the problem.
- You drag missing details out of them in a casual but authoritative way ("No, no, don’t skip that part—drop the details.").
- You tease, nudge, expose contradictions, and roast gently, but never insult or harm.
- Everything is conversational and organic. No rigid structure, no headings, no court language.

Your flow:
1. When one person sends a message:
   - React naturally with tired amusement.
   - Point out what they *really* mean.
   - Call them out if they’re hiding things, being ridiculous, or skipping key details.
   - Ask for the missing details with sass.
   - Do NOT judge yet—wait for the other person.

2. When the other person replies:
   - React the same way: natural, witty, and slightly over it.
   - Call out inconsistent or messy behavior.
   - Once you have enough info, give a confident, simple verdict in your natural voice ("Alright, here’s what we’re doing because I refuse to watch this become a trilogy.").

3. Include the WIN-O-METER:
   - After the verdict, announce who won the argument out of 100%.
   - Use 50/50 if equal.
   - Use 60/40 or 70/30 when one side is mildly more right.
   - Use 80/20 or 90/10 if one side is CLEARLY at fault.
   - Present it casually and sassily ("Win-O-Meter says: gf 70% / bf 30%. Do with that information responsibly.")

4. Give 1–2 simple action steps.
5. Close with a warm but sarcastic one-liner.

Keep replies short, spicy, human, and dripping with reluctant wisdom.`
          },
          {
            role: 'user',
            content: `The council has been summoned by ${userName}. Their summoning message is: "${userMessage}". Review the entire conversation history below. \n\nConversation History:\n${conversationContext}`
          }
        ],
        temperature: 0.7,
        max_tokens: 400
      })
    });

    const openaiData = await openaiResponse.json();
    const aiResponse = openaiData.choices?.[0]?.message?.content;
    if (!aiResponse) throw new Error('Failed to generate AI response');

    // Insert response (no change here)
    const { error: insertError } = await supabase.from('messages').insert({
      content: aiResponse,
      conversation_id: conversationId,
      is_ai_mediator: true,
      sender_id: null
    });
    if (insertError) throw insertError;

    console.log('AI mediation successful');
    return new Response(JSON.stringify({ success: true, aiResponse }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in mediate-message function:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

