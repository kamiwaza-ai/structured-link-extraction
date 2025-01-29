import { generateObject } from 'ai';
import { z } from 'zod';
import { createWrappedModel } from '@/lib/kamiwaza/provider';
import { experimental_wrapLanguageModel as wrapLanguageModel } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';

export const runtime = 'edge';

// Define schemas for different extractors
const quoteSchema = z.object({
  quotes: z.array(z.object({
    text: z.string(),
    significance: z.string(),
    context: z.string()
  }))
});

const emailSchema = z.object({
  subject: z.string(),
  body: z.string(),
  callToAction: z.string()
});

const keyPointsSchema = z.object({
  mainPoints: z.array(z.object({
    point: z.string(),
    evidence: z.string()
  })),
  conclusion: z.string()
});

// Map extractor IDs to their schemas
const extractorSchemas: Record<string, z.ZodType> = {
  'key-quotes': quoteSchema,
  'sales-email': emailSchema,
  'key-points': keyPointsSchema,
  'custom': z.object({ analysis: z.string() })
};

export async function POST(req: Request) {
  try {
    const { transcript, model, extractorId, customPrompt } = await req.json();
    
    // Get the appropriate schema
    const schema = extractorSchemas[extractorId] || extractorSchemas.custom;
    const prompt = customPrompt || getDefaultPrompt(extractorId);

    let wrappedModel;

    if (model.type === 'claude') {
      if (!process.env.ANTHROPIC_API_KEY) {
        throw new Error('ANTHROPIC_API_KEY environment variable is not set');
      }

      // Use the anthropic instance directly
      wrappedModel = anthropic(model.apiIdentifier);
    } else {
      // Kamiwaza model
      if (!process.env.NEXT_PUBLIC_KAMIWAZA_URI) {
        throw new Error('NEXT_PUBLIC_KAMIWAZA_URI environment variable is not set');
      }

      if (!model?.deployment?.lb_port) {
        throw new Error('Model deployment information is missing');
      }

      const baseModel = createWrappedModel('model', model.deployment.lb_port);
      wrappedModel = wrapLanguageModel({
        model: baseModel,
        middleware: {}
      });
    }

    // Use generateObject to get structured output
    const { object } = await generateObject({
      model: wrappedModel,
      schema,
      prompt: `Analyze this transcript and extract the requested information:
      
Transcript:
${transcript}

${prompt}`,
    });

    return Response.json({ result: object });
  } catch (error) {
    console.error('Error in analyze route:', error);
    if (error instanceof Error) {
      console.error('Error stack:', error.stack);
    }
    return Response.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

function getDefaultPrompt(extractorId: string): string {
  switch (extractorId) {
    case 'key-quotes':
      return 'Extract 3-5 most important quotes from the transcript. For each quote, provide the exact quote text, its significance, and the context around it.';
    case 'sales-email':
      return 'Create a sales email based on the transcript content. Include a subject line, email body referencing specific insights, and a clear call to action. You are writing the email to the speaker in the video. Use the context of what theyre discussing in your intro and find a unique way to pivot to trying to sell them on Kamiwaza. Kamiwaza is a Generative AI Platform for Enterprises that enables them to build, deploy, and scale Generative AI applications. Make the email convincing and personalized to the speaker, but not too salesy.';
    case 'key-points':
      return 'Analyze the transcript and provide the main points with supporting evidence, and a conclusion.';
    default:
      return 'Analyze the transcript and provide structured insights.';
  }
}