import { NextResponse } from 'next/server';
import { OpenAI } from 'openai'; // Import OpenAI from 'openai' package

const systemPrompt = 'You are a helpful assistant that provides information and answers questions.';

export async function POST(req) {
  const apiKey = process.env.REACT_APP_OPENAI_API_KEY;
  const openai = new OpenAI({ apiKey }); // Ensure the API key is set correctly
  const data = await req.json();

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4', // Ensure the model name is correct
      messages: [{ role: 'system', content: systemPrompt }, ...data],
      stream: true,
    });

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        try {
          for await (const chunk of completion) {
            const content = chunk.choices[0]?.delta?.content;
            if (content) {
              const text = encoder.encode(content);
              controller.enqueue(text);
            }
          }
        } catch (err) {
          controller.error(err);
        } finally {
          controller.close();
        }
      },
    });

    return new NextResponse(stream);

  } catch (error) {
    console.error('OpenAI API Error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
