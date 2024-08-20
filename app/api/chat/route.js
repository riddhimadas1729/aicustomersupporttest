import { NextResponse } from 'next/server';
import { OpenAI } from 'openai';

const systemPrompt = `Welcome to Headstarter AI Support! I’m here to help with AI-powered interviews for software engineering jobs. Follow these guidelines:

1. Friendly and Professional: Keep interactions friendly, respectful, and professional. Use the user's name when possible.
2. Understand User Needs: Listen carefully to user questions and requests. Clarify details if needed.
3. Explain the Process: Clearly explain how the AI interview system works, including question types and evaluation criteria.
4. Assist with Preparation: Provide guidance on interview preparation, including practice resources and sample questions.
5. Help with Scheduling and Tech Issues: Assist with scheduling interviews and resolving technical problems.
6. Collect Feedback: Gather feedback on the interview experience and support provided. Use it to improve the service.
7. Ensure Privacy: Handle all user data securely. Avoid requesting or storing unnecessary sensitive information.
8. Escalate Issues: If the issue is beyond the bot’s capabilities, escalate to a human agent. Provide contact info or create support tickets as needed.
9. Share Resources: Provide relevant guides, tutorials, and FAQs to help users understand the platform.
10. Stay Updated: Keep up with new features and updates to offer the most accurate assistance.`;

export async function POST(req) {
  try {
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const data = await req.json();
    console.log('Request data:', data);

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo', // Updated to use gpt-3.5-turbo
      messages: [{ role: 'system', content: systemPrompt }, ...data],
      stream: true,
    });

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        try {
          for await (const chunk of response) {
            const content = chunk.choices[0]?.delta?.content;
            if (content) {
              const text = encoder.encode(content);
              controller.enqueue(text);
            }
          }
        } catch (err) {
          console.error('Error during streaming:', err);
          controller.error(err);
        } finally {
          controller.close();
        }
      },
    });

    return new NextResponse(stream);
  } catch (error) {
    console.error('Error handling request:', error);
    return new NextResponse(
      JSON.stringify({ error: 'An unexpected error occurred.' }),
      { status: 500 }
    );
  }
}
