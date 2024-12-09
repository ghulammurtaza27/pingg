export function calculateRelevanceScore(request: string, organizationalGoals: string): number {
  const requestWords = new Set(request.toLowerCase().split(/\s+/));
  const goalWords = new Set(organizationalGoals.toLowerCase().split(/\s+/));

  const commonWords = new Set([...requestWords].filter(word => goalWords.has(word)));
  const relevanceScore = commonWords.size / Math.max(requestWords.size, goalWords.size);

  return Math.min(1, Math.max(0, relevanceScore));
}

