import { createKamiwazaProvider } from './provider';
import { KamiwazaClient, UIModelDeployment, KamiwazaModel } from './client';

export interface Model {
  id: string;
  label: string;
  apiIdentifier: string;
  description: string;
  type: 'kamiwaza' | 'claude';
  deployment?: {
    id: string;
    lb_port: number;
  };
}

const CLAUDE_MODEL: Model = {
  id: 'claude-3-sonnet',
  label: 'Claude 3 Sonnet',
  apiIdentifier: 'claude-3-sonnet-20240229',
  description: 'Latest Claude model optimized for fast, efficient responses',
  type: 'claude'
};

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
    type: 'kamiwaza',
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

  const kamiwazaModels = modelList.map(model => {
    const deployment = deployments.find(d => d.m_id === model.id);
    return mapKamiwazaToModel(model, deployment);
  });

  // Combine Kamiwaza models with Claude
  models = [CLAUDE_MODEL, ...kamiwazaModels];

  return models;
}
