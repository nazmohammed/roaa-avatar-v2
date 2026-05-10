/**
 * Azure Speech token fetcher — caches token for 9 minutes.
 */

let cachedToken: { token: string; region: string; expiresAt: number } | null = null;

export async function getSpeechToken(): Promise<{ token: string; region: string }> {
  if (cachedToken && Date.now() < cachedToken.expiresAt) {
    return { token: cachedToken.token, region: cachedToken.region };
  }

  const resp = await fetch("/api/token");
  if (!resp.ok) throw new Error(`Token fetch failed: ${resp.status}`);

  const data = await resp.json();
  cachedToken = {
    token: data.token,
    region: data.region,
    expiresAt: Date.now() + 9 * 60 * 1000, // 9 min cache
  };

  return { token: data.token, region: data.region };
}

/**
 * Fetch ICE (TURN relay) credentials for WebRTC avatar connection.
 */
export async function getIceToken(): Promise<{
  Urls: string[];
  Username: string;
  Password: string;
}> {
  const resp = await fetch("/api/ice");
  if (!resp.ok) throw new Error(`ICE token fetch failed: ${resp.status}`);
  return resp.json();
}

/**
 * Match transcript to scripted answer.
 */
export async function matchIntent(transcript: string): Promise<{
  intentId: string;
  question: string;
  answer: string;
  transcript: string;
}> {
  const resp = await fetch("/api/match", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ transcript }),
  });

  if (!resp.ok) throw new Error(`Match failed: ${resp.status}`);
  return resp.json();
}
