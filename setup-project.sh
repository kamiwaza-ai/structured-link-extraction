#!/bin/bash

# Create necessary directories
mkdir -p app/api/transcript/{extract,analyze}
mkdir -p components/ui
mkdir -p lib/{kamiwaza,extractors}

# Create API route files
cat > app/api/transcript/extract/route.ts << 'EOL'
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { videoUrl } = await req.json();
    
    // TODO: Implement YouTube transcript extraction
    
    return NextResponse.json({ transcript: "Sample transcript" });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
EOL

cat > app/api/transcript/analyze/route.ts << 'EOL'
import { NextResponse } from 'next/server';
import { createWrappedModel } from '@/lib/kamiwaza/provider';
import { experimental_wrapLanguageModel as wrapLanguageModel } from 'ai';

export const runtime = 'edge';

export async function POST(req: Request) {
  try {
    const { transcript, model, extractorId, customPrompt } = await req.json();
    
    if (!process.env.NEXT_PUBLIC_KAMIWAZA_URI) {
      throw new Error('NEXT_PUBLIC_KAMIWAZA_URI environment variable is not set');
    }

    const baseModel = createWrappedModel('model', model.deployment.lb_port);
    const wrappedModel = wrapLanguageModel({
      model: baseModel,
      middleware: {}
    });

    // TODO: Implement analysis logic
    
    return NextResponse.json({ result: "Analysis result" });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
EOL

# Create component files
cat > components/ModelSelector.tsx << 'EOL'
'use client';

import { useState, useEffect } from 'react';
import { Model, initializeModels } from '@/lib/kamiwaza/models';

interface ModelSelectorProps {
  onModelSelect: (model: Model) => void;
  className?: string;
}

export default function ModelSelector({ onModelSelect, className = '' }: ModelSelectorProps) {
  const [models, setModels] = useState<Model[]>([]);
  const [selectedModel, setSelectedModel] = useState<Model | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadModels = async () => {
      try {
        setIsLoading(true);
        const availableModels = await initializeModels();
        setModels(availableModels);
        
        if (availableModels.length > 0 && !selectedModel) {
          setSelectedModel(availableModels[0]);
          onModelSelect(availableModels[0]);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load models');
      } finally {
        setIsLoading(false);
      }
    };

    loadModels();
  }, []);

  if (error) {
    return (
      <div className="text-red-400 p-4 rounded-md bg-zinc-800 border border-red-900 mb-4">
        Error loading models: {error}
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="animate-pulse bg-zinc-800 h-[50px] rounded-md mb-4"></div>
    );
  }

  return (
    <div className={`w-full mb-4 ${className}`}>
      <select
        className="w-full bg-zinc-800 p-3 border border-zinc-700 rounded-md text-zinc-100"
        value={selectedModel?.id || ''}
        onChange={(e) => {
          const model = models.find(m => m.id === e.target.value);
          if (model) {
            setSelectedModel(model);
            onModelSelect(model);
          }
        }}
      >
        {models.map((model) => (
          <option 
            key={model.id} 
            value={model.id}
            disabled={!model.deployment}
          >
            {model.label} {!model.deployment && '(Not Deployed)'}
          </option>
        ))}
      </select>
    </div>
  );
}
EOL

cat > components/TranscriptAnalyzer.tsx << 'EOL'
'use client';

import { useState } from 'react';
import { Model } from '@/lib/kamiwaza/models';
import ModelSelector from './ModelSelector';
import TranscriptDisplay from './TranscriptDisplay';
import ExtractorTemplates from './ExtractorTemplates';

export default function TranscriptAnalyzer() {
  const [url, setUrl] = useState('');
  const [transcript, setTranscript] = useState('');
  const [selectedModel, setSelectedModel] = useState<Model>();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;

    setLoading(true);
    try {
      const response = await fetch('/api/transcript/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoUrl: url }),
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error);
      setTranscript(data.transcript);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-6">
        <h2 className="text-lg font-semibold mb-4 text-zinc-100">YouTube Transcript Analyzer</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Paste YouTube URL"
            className="w-full p-3 border rounded-md bg-zinc-800 border-zinc-700 text-zinc-100"
          />
          <button
            type="submit"
            disabled={loading || !url}
            className="w-full px-4 py-2 bg-blue-600 text-zinc-100 rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Analyze'}
          </button>
        </form>
      </div>

      {transcript && (
        <>
          <TranscriptDisplay transcript={transcript} />
          <ModelSelector onModelSelect={setSelectedModel} />
          <ExtractorTemplates
            transcript={transcript}
            model={selectedModel}
          />
        </>
      )}
    </div>
  );
}
EOL

cat > components/TranscriptDisplay.tsx << 'EOL'
interface TranscriptDisplayProps {
  transcript: string;
}

export default function TranscriptDisplay({ transcript }: TranscriptDisplayProps) {
  const handleCopy = () => {
    navigator.clipboard.writeText(transcript);
  };

  return (
    <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-zinc-100">Transcript</h2>
        <button
          onClick={handleCopy}
          className="px-3 py-1 text-sm text-blue-400 hover:text-blue-300"
        >
          Copy
        </button>
      </div>
      <div className="bg-zinc-800 p-4 rounded-md border border-zinc-700 max-h-[400px] overflow-auto">
        <p className="text-zinc-100 whitespace-pre-wrap">{transcript}</p>
      </div>
    </div>
  );
}
EOL

cat > components/ExtractorTemplates.tsx << 'EOL'
import { useState } from 'react';
import { Model } from '@/lib/kamiwaza/models';
import { presetExtractors } from '@/lib/extractors/presets';

interface ExtractorTemplatesProps {
  transcript: string;
  model?: Model;
}

export default function ExtractorTemplates({ transcript, model }: ExtractorTemplatesProps) {
  const [selectedExtractor, setSelectedExtractor] = useState(presetExtractors[0]);
  const [customPrompt, setCustomPrompt] = useState('');
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const handleAnalyze = async () => {
    if (!model) return;
    
    setLoading(true);
    try {
      const response = await fetch('/api/transcript/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript,
          model,
          extractorId: selectedExtractor.id,
          customPrompt
        }),
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error);
      setResult(data.result);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-6">
      <h2 className="text-lg font-semibold mb-4 text-zinc-100">Analysis Templates</h2>
      
      <div className="space-y-4">
        <select
          className="w-full bg-zinc-800 p-3 border border-zinc-700 rounded-md text-zinc-100"
          value={selectedExtractor.id}
          onChange={(e) => {
            const extractor = presetExtractors.find(ex => ex.id === e.target.value);
            if (extractor) setSelectedExtractor(extractor);
          }}
        >
          {presetExtractors.map((extractor) => (
            <option key={extractor.id} value={extractor.id}>
              {extractor.name}
            </option>
          ))}
          <option value="custom">Custom Prompt</option>
        </select>

        {selectedExtractor.id === 'custom' && (
          <textarea
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            className="w-full p-3 border rounded-md bg-zinc-800 border-zinc-700 text-zinc-100"
            rows={4}
            placeholder="Enter your custom prompt..."
          />
        )}

        <button
          onClick={handleAnalyze}
          disabled={loading || !model}
          className="w-full px-4 py-2 bg-blue-600 text-zinc-100 rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Analyzing...' : 'Analyze'}
        </button>

        {result && (
          <div className="bg-zinc-800 p-4 rounded-md border border-zinc-700">
            <pre className="text-zinc-100 whitespace-pre-wrap">{result}</pre>
          </div>
        )}
      </div>
    </div>
  );
}
EOL

# Create lib files
cat > lib/kamiwaza/client.ts << 'EOL'
export interface KamiwazaModel {
  id: string;
  name: string;
  hub: string | null;
  version: string | null;
  private: boolean | null;
  description: string | null;
}

export interface ModelInstance {
  id: string;
  deployment_id: string;
  host_name: string | null;
  listen_port: number;
  status: string;
}

export interface UIModelDeployment {
  id: string;
  m_id: string;
  engine: string;
  container: string;
  status: string;
  lb_port: number;
  instances: ModelInstance[];
}

export class KamiwazaClient {
  constructor(private baseUrl: string) {}

  async listModels(): Promise<KamiwazaModel[]> {
    const response = await fetch(`${this.baseUrl}/models/`);
    if (!response.ok) throw new Error('Failed to fetch models');
    return response.json();
  }

  async listDeployments(modelId?: string): Promise<UIModelDeployment[]> {
    const url = modelId 
      ? `${this.baseUrl}/serving/deployments?model_id=${modelId}`
      : `${this.baseUrl}/serving/deployments`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch deployments');
    const deployments: UIModelDeployment[] = await response.json();
    return deployments.filter((d) => d.status === 'DEPLOYED');
  }
}
EOL

cat > lib/kamiwaza/models.ts << 'EOL'
import { createKamiwazaProvider } from './provider';
import { KamiwazaClient, UIModelDeployment, KamiwazaModel } from './client';

export interface Model {
  id: string;
  label: string;
  apiIdentifier: string;
  description: string;
  deployment?: {
    id: string;
    lb_port: number;
  };
}

export let models: Model[] = [];

export function mapKamiwazaToModel(
  model: KamiwazaModel, 
  deployment?: UIModelDeployment
): Model {
  return {
    id: model.id,
    label: model.name,
    apiIdentifier: `${model.name}${model.version ? `@${model.version}` : ''}`,
    description: model.description || '',
    deployment: deployment ? {
      id: deployment.id,
      lb_port: deployment.lb_port
    } : undefined
  };
}

export async function initializeModels() {
  if (!process.env.NEXT_PUBLIC_KAMIWAZA_URI) {
    throw new Error('NEXT_PUBLIC_KAMIWAZA_URI environment variable is not set');
  }
  
  const client = new KamiwazaClient(process.env.NEXT_PUBLIC_KAMIWAZA_URI);
  const [modelList, deployments] = await Promise.all([
    client.listModels(),
    client.listDeployments()
  ]);

  models = modelList.map(model => {
    const deployment = deployments.find(d => d.m_id === model.id);
    return mapKamiwazaToModel(model, deployment);
    });

  return models;
}
EOL

cat > lib/kamiwaza/provider.ts << 'EOL'
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
EOL

cat > lib/extractors/types.ts << 'EOL'
export interface Extractor {
  id: string;
  name: string;
  description: string;
  prompt: string;
  example?: string;
}
EOL

cat > lib/extractors/presets.ts << 'EOL'
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
EOL

cat > lib/youtube.ts << 'EOL'
export async function getVideoId(url: string): Promise<string> {
  const regExp = /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  
  if (match && match[2].length === 11) {
    return match[2];
  }
  
  throw new Error('Invalid YouTube URL');
}

export async function fetchTranscript(videoId: string): Promise<string> {
  // TODO: Implement transcript fetching using youtube-transcript-api
  // This will be implemented in the API route
  return '';
}
EOL

# Update app/page.tsx to use our new component
cat > app/page.tsx << 'EOL'
import TranscriptAnalyzer from '@/components/TranscriptAnalyzer';

export default function Home() {
  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-50">
      <TranscriptAnalyzer />
    </main>
  );
}
EOL

# Install required dependencies
npm install @ai-sdk/openai-compatible

# Make the script executable
chmod +x setup-project.sh

echo "Project setup complete! Don't forget to:"
echo "1. Set your NEXT_PUBLIC_KAMIWAZA_URI environment variable"
echo "2. Install any missing dependencies if needed"
echo "3. Update the YouTube transcript fetching implementation in the API route"
