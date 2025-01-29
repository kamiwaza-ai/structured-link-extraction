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
            disabled={model.type === 'kamiwaza' && !model.deployment}
          >
            {model.label} {model.type === 'kamiwaza' && !model.deployment && '(Not Deployed)'}
          </option>
        ))}
      </select>
    </div>
  );
}
