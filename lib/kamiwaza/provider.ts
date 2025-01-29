import { createOpenAICompatible } from '@ai-sdk/openai-compatible';

export function createKamiwazaProvider(port: number) {
  const baseUrl = process.env.NEXT_PUBLIC_KAMIWAZA_URI!
    .replace('https://', 'http://')
    .replace('/api', '');
  
  return createOpenAICompatible({
    name: 'model',
    baseURL: `${baseUrl}:${port}/v1`,
    headers: {
      'Content-Type': 'application/json'
    }
  });
}

export function createWrappedModel(modelName: string, port: number) {
  const provider = createKamiwazaProvider(port);
  return provider('model');
}
