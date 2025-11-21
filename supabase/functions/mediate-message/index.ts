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
            content: 'You are the head of eldersfive, a council that is setup to resolve disputes among two individuals. Your personality is that of a wise, snarky, sassy, blunt and authoritative elder. Speak less be cool and consise.Your goal is to resolve disputes by understanding both sides. If you have any questions then ask, else deliver a final binding judgement. Ensure you hear from both sides before delivering judgement.'
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