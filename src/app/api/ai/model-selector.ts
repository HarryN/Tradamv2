export const DEFAULT_TEXT_MODEL = 'gemini-2.0-flash';
export const DEFAULT_TTS_MODEL = 'gemini-2.5-flash-preview-tts';

export function resolveConfiguredTextModel(): string {
  return process.env.GEMINI_TEXT_MODEL || process.env.GEMINI_MODEL || DEFAULT_TEXT_MODEL;
}

export function resolveConfiguredTtsModel(): string {
  return process.env.GEMINI_TTS_MODEL || DEFAULT_TTS_MODEL;
}

function isTextSafeModelName(name: string): boolean {
  const normalized = name.toLowerCase();
  return !normalized.includes('tts') && !normalized.includes('audio');
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values));
}

export const AI_MODEL_CANDIDATES = unique(
  [resolveConfiguredTextModel(), DEFAULT_TEXT_MODEL]
    .filter(Boolean)
    .filter(isTextSafeModelName)
);

// Models that are known to have zero quota or be extremely unstable for free-tier in certain regions
const EXCLUDED_MODELS = [
  'gemini-2.5-pro',
  'gemini-2.5-flash',
  'gemini-2.5-pro-preview-tts',
];

export interface ModelInfo {
  name: string;
  supportedMethods: string[];
}

export async function listAvailableModels(apiKey: string): Promise<ModelInfo[]> {
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    return (data.models || []).map((entry: any) => ({
      name: entry.name as string,
      supportedMethods: (entry.supportedGenerationMethods || []) as string[]
    }));
  } catch (error) {
    return [];
  }
}

export async function getOrderedModels(apiKey: string): Promise<string[]> {
  const availableModels = await listAvailableModels(apiKey);
  
  if (availableModels.length === 0) {
    return AI_MODEL_CANDIDATES.length > 0 ? AI_MODEL_CANDIDATES : [DEFAULT_TEXT_MODEL];
  }

  const genModels = availableModels
    .filter(m => m.supportedMethods.includes('generateContent'))
    .map(m => m.name.replace(/^models\//, ''))
    .filter(name => !EXCLUDED_MODELS.includes(name))
    .filter(isTextSafeModelName);

  const ordered: string[] = [];
  
  // First, add our preferred candidates in order
  for (const candidate of AI_MODEL_CANDIDATES) {
    if (genModels.includes(candidate)) {
      ordered.push(candidate);
    }
  }

  // Then add any other models that support generateContent but aren't in our list
  for (const model of genModels) {
    if (!ordered.includes(model)) {
      ordered.push(model);
    }
  }

  return ordered.length > 0
    ? ordered
    : (AI_MODEL_CANDIDATES.length > 0 ? AI_MODEL_CANDIDATES : [DEFAULT_TEXT_MODEL]);
}

export async function selectAvailableModel(apiKey: string): Promise<string> {
  const ordered = await getOrderedModels(apiKey);
  return ordered[0] || DEFAULT_TEXT_MODEL;
}
