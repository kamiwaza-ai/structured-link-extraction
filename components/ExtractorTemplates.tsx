import { useState } from 'react';
import { Model } from '@/lib/kamiwaza/models';
import { presetExtractors } from '@/lib/extractors/presets';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface ExtractorTemplatesProps {
  transcript: string;
  model?: Model;
  className?: string;
}

type AnalysisResult = {
  quotes?: Array<{ text: string; significance: string; context: string }>;
  mainPoints?: Array<{ point: string; evidence: string }>;
  subject?: string;
  body?: string;
  callToAction?: string;
  analysis?: string;
  conclusion?: string;
};

export default function ExtractorTemplates({ transcript, model, className = '' }: ExtractorTemplatesProps) {
  const [selectedExtractor, setSelectedExtractor] = useState(presetExtractors[0]);
  const [customPrompt, setCustomPrompt] = useState('');
  const [result, setResult] = useState<AnalysisResult | null>(null);
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
          customPrompt: selectedExtractor.id === 'custom' ? customPrompt : undefined
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

  const renderResult = () => {
    if (!result) return null;

    switch (selectedExtractor.id) {
      case 'key-quotes':
        return (
          <div className="space-y-4">
            {result.quotes?.map((quote, idx) => (
              <Card key={idx} className="bg-zinc-800/50">
                <CardContent className="pt-6">
                  <blockquote className="border-l-2 border-blue-500 pl-4 mb-2 text-zinc-100">
                    "{quote.text}"
                  </blockquote>
                  <div className="text-sm text-zinc-300 space-y-2">
                    <p><span className="font-semibold">Significance:</span> {quote.significance}</p>
                    <p><span className="font-semibold">Context:</span> {quote.context}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        );

      case 'sales-email':
        return result.subject ? (
          <Card className="bg-zinc-800/50">
            <CardContent className="pt-6 space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-zinc-400">Subject</h3>
                <p className="text-zinc-100">{result.subject}</p>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-zinc-400">Body</h3>
                <p className="text-zinc-100 whitespace-pre-wrap">{result.body}</p>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-zinc-400">Call to Action</h3>
                <p className="text-zinc-100">{result.callToAction}</p>
              </div>
            </CardContent>
          </Card>
        ) : null;

      case 'key-points':
        return (
          <div className="space-y-4">
            {result.mainPoints?.map((point, idx) => (
              <Card key={idx} className="bg-zinc-800/50">
                <CardContent className="pt-6">
                  <h3 className="font-medium text-zinc-100 mb-2">
                    {idx + 1}. {point.point}
                  </h3>
                  <p className="text-sm text-zinc-300">{point.evidence}</p>
                </CardContent>
              </Card>
            ))}
            {result.conclusion && (
              <Card className="bg-zinc-800/50 border-t-2 border-blue-500">
                <CardContent className="pt-6">
                  <h3 className="font-medium text-zinc-100 mb-2">Conclusion</h3>
                  <p className="text-sm text-zinc-300">{result.conclusion}</p>
                </CardContent>
              </Card>
            )}
          </div>
        );

      case 'custom':
        return (
          <Card className="bg-zinc-800/50">
            <CardContent className="pt-6">
              <p className="text-zinc-100 whitespace-pre-wrap">{result.analysis}</p>
            </CardContent>
          </Card>
        );

      default:
        return null;
    }
  };

  return (
    <div className={`rounded-lg border p-6 ${className}`}>
      <h2 className="text-lg font-semibold mb-4 text-zinc-100">Analysis Templates</h2>
      
      <div className="space-y-4">
        <select
          className="w-full bg-zinc-800/50 p-3 border border-zinc-700 rounded-md text-zinc-100 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
          value={selectedExtractor.id}
          onChange={(e) => {
            const extractor = presetExtractors.find(ex => ex.id === e.target.value);
            if (extractor) {
              setSelectedExtractor(extractor);
              setResult(null);
            }
          }}
        >
          {presetExtractors.map((extractor) => (
            <option key={extractor.id} value={extractor.id}>
              {extractor.name}
            </option>
          ))}
        </select>

        {selectedExtractor.id === 'custom' && (
          <textarea
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            className="w-full p-3 border rounded-md bg-zinc-800/50 border-zinc-700 text-zinc-100 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
            rows={4}
            placeholder="Enter your custom prompt..."
          />
        )}

        <button
          onClick={handleAnalyze}
          disabled={loading || !model}
          className="w-full px-4 py-2 bg-emerald-600 text-zinc-100 rounded-md hover:bg-emerald-700 disabled:opacity-50 transition-colors"
        >
          {loading ? 'Analyzing...' : 'Analyze'}
        </button>

        {result && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-4 text-zinc-100">Results</h3>
            {renderResult()}
          </div>
        )}
      </div>
    </div>
  );
}