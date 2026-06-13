export async function generateProductDescription(
  title: string, 
  category: string, 
  language: string = 'English'
): Promise<string> {
  const response = await fetch('/api/ai/generate-description', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ title, category, language }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to generate description');
  }

  const data = await response.json();
  return data.description;
}

export async function translateDynamicTexts(
  texts: string[],
  targetLanguage: string = 'French'
): Promise<string[]> {
  const normalizedTexts = texts
    .map((text) => text?.trim())
    .filter((text): text is string => Boolean(text));

  if (normalizedTexts.length === 0) {
    return [];
  }

  const response = await fetch('/api/ai/translate-text', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ texts: normalizedTexts, targetLanguage }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to translate content');
  }

  const data = await response.json();
  return Array.isArray(data.translations) ? data.translations : normalizedTexts;
}

export async function suggestDisputeResolution(
  reason: string,
  description: string,
  messages: { sender_role: string, message: string }[]
): Promise<string> {
  const response = await fetch('/api/ai/dispute-helper', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ reason, description, messages }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to suggest resolution');
  }

  const data = await response.json();
  return data.suggestion;
}

export async function getSmartSearchKeywords(query: string): Promise<string[]> {
  const response = await fetch('/api/ai/smart-search', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to get smart keywords');
  }

  const data = await response.json();
  return data.keywords;
}

export async function getSellerStoreInsights(sellerId: string, stats: any[]): Promise<string> {
  const response = await fetch('/api/ai/seller-insights', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ sellerId, stats }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to get seller insights');
  }

  const data = await response.json();
  return data.insight;
}

export async function getAccountAnalysis(options: {
  role: 'buyer' | 'seller' | 'admin';
  language?: string;
  accountSnapshot: Record<string, any>;
}): Promise<string> {
  const response = await fetch('/api/ai/account-analysis', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(options),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to generate account analysis');
  }

  const data = await response.json();
  return data.analysis;
}

export async function getDisputeAccountInsights(
  dispute: any,
  buyerStats: Record<string, any>,
  sellerStats: Record<string, any>
): Promise<string> {
  const response = await fetch('/api/ai/dispute-account-insights', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ dispute, buyerStats, sellerStats }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to get dispute account insights');
  }

  const data = await response.json();
  return data.insight;
}

export async function getBuyerShoppingInsights(userId: string, orderHistory: any[]): Promise<string> {
  const response = await fetch('/api/ai/buyer-insights', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ userId, orderHistory }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to get buyer insights');
  }

  const data = await response.json();
  return data.insight;
}

export async function askPlatformQuestion(
  question: string,
  role?: 'buyer' | 'seller' | 'admin',
  language: string = 'English'
): Promise<string> {
  const response = await fetch('/api/ai/platform-question', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ question, role, language }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to answer your question');
  }

  const data = await response.json();
  return data.answer;
}
