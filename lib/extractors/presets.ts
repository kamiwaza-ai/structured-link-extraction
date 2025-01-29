import { Extractor } from './types';

export const presetExtractors: Extractor[] = [
  {
    id: 'key-quotes',
    name: 'Key Quotes',
    description: 'Extract important quotes with context',
    prompt: 'Extract 3-5 of the most important quotes from the transcript. For each quote, provide:\n1. The exact quote\n2. Why this quote is significant\n3. The broader context around this quote',
    example: 'Find impactful quotes that represent key insights or turning points'
  },
  {
    id: 'sales-email',
    name: 'Sales Email Draft',
    description: 'Create an email draft based on speaker insights',
    prompt: 'Draft a brief, engaging email that:\n1. References a specific insight from the speaker\n2. Connects their point to a potential value proposition\n3. Ends with a clear next step',
    example: 'Generate an email that leverages the speakers insights'
  },
  {
    id: 'key-points',
    name: 'Main Points Summary',
    description: 'Summarize the key points and insights',
    prompt: 'Analyze the transcript and provide:\n1. The 3-5 main points/arguments\n2. Supporting evidence for each point\n3. Any significant conclusions or calls to action',
    example: 'Extract the core message and supporting points'
  },
  {
    id: 'custom',
    name: 'Custom Analysis',
    description: 'Analyze the transcript with your own prompt',
    prompt: '',
    example: 'Enter your own analysis prompt'
  }
];
