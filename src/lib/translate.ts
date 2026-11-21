/**
 * Pluggable machine translation. Set TRANSLATE_API_URL to a LibreTranslate-
 * compatible endpoint (e.g. https://libretranslate.com). When unset we return
 * null and the UI simply shows the original message.
 *
 * This keeps the marketplace provider-agnostic: any compatible service works,
 * and the chat still functions without one.
 */


export async function translateText(
  text: string,
  targetLang: string,
  sourceLang?: string,
): Promise<string | null> {
  const base = process.env.TRANSLATE_API_URL;
  if (!base || !text.trim()) return null;
  try {
    const body = new URLSearchParams();
    body.set("q", text);
    body.set("target", targetLang);
    body.set("source", sourceLang || "auto");
    body.set("format", "text");
    if (process.env.TRANSLATE_API_KEY) body.set("api_key", process.env.TRANSLATE_API_KEY);

    const res = await fetch(base.replace(/\/$/, "") + "/translate", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { translatedText?: string };
    return json.translatedText ?? null;
  } catch {
    return null;
  }
}

export function isTranslationEnabled(): boolean {
  return Boolean(process.env.TRANSLATE_API_URL);
}

