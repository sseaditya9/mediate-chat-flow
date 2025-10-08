import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { conversationId, userMessage } = await req.json();
    
    console.log('Processing mediation for conversation:', conversationId);
    console.log('User message:', userMessage);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const openaiKey = Deno.env.get('OPENAI_API_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch recent messages for context
    const { data: messages, error: fetchError } = await supabase
      .from('messages')
      .select('content, is_ai_mediator, created_at')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false })
      .limit(10);

    if (fetchError) {
      console.error('Error fetching messages:', fetchError);
      throw fetchError;
    }

    // Build conversation context
    const conversationContext = messages
      ?.reverse()
      .map(m => `${m.is_ai_mediator ? 'AI Mediator' : 'User'}: ${m.content}`)
      .join('\n') || '';

    console.log('Conversation context:', conversationContext);

    // Call OpenAI API
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful AI mediator facilitating productive conversations. Be concise, empathetic, and help participants understand each other better. Encourage constructive dialogue.'
          },
          {
            role: 'user',
            content: `Recent conversation:\n${conversationContext}\n\nLatest message: ${userMessage}\n\nProvide a brief mediation response that acknowledges the message and helps move the conversation forward constructively.`
          }
        ],
        temperature: 0.8,
        max_tokens: 200,
      }),
    });

    const openaiData = await openaiResponse.json();
    console.log('OpenAI response:', openaiData);

    const aiResponse = openaiData.choices?.[0]?.message?.content;

    if (!aiResponse) {
      console.error('No AI response generated');
      throw new Error('Failed to generate AI response');
    }

    // Insert AI response as a message
    const { error: insertError } = await supabase
      .from('messages')
      .insert({
        content: aiResponse,
        conversation_id: conversationId,
        is_ai_mediator: true,
        sender_id: null,
      });

    if (insertError) {
      console.error('Error inserting AI message:', insertError);
      throw insertError;
    }

    console.log('AI mediation successful');

    return new Response(
      JSON.stringify({ success: true, aiResponse }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in mediate-message function:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});