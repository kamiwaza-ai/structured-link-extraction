'use client';

import { useState } from 'react';
import Image from 'next/image';
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
    <div className="min-h-screen bg-zinc-950 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header with Logo */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-zinc-100">YouTube Transcript Analyzer</h1>
          <div className="flex items-center gap-2 text-zinc-400">
            <span>Powered by</span>
            <Image 
              src="/kamiwaza_words_logo_white.png"
              alt="Kamiwaza"
              width={120}
              height={30}
              className="dark:invert"
            />
          </div>
        </div>

        {/* URL Input Section */}
        <div className="bg-zinc-900/50 rounded-lg border border-zinc-800 p-6 mb-8 backdrop-blur-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Paste YouTube URL"
              className="w-full p-3 border rounded-md bg-zinc-800/50 border-zinc-700 text-zinc-100 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
            />
            <button
              type="submit"
              disabled={loading || !url}
              className="w-full px-4 py-2 bg-emerald-600 text-zinc-100 rounded-md hover:bg-emerald-700 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Loading...' : 'Get Transcript'}
            </button>
          </form>
        </div>

        {transcript && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Panel - Transcript */}
            <div className="space-y-6">
              <TranscriptDisplay transcript={transcript} />
            </div>

            {/* Right Panel - Analysis */}
            <div className="space-y-6">
              <ModelSelector 
                onModelSelect={setSelectedModel}
                className="bg-zinc-900/50 border-zinc-800 backdrop-blur-sm"
              />
              <ExtractorTemplates
                transcript={transcript}
                model={selectedModel}
                className="bg-zinc-900/50 border-zinc-800 backdrop-blur-sm"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
