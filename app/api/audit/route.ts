// Route Handler — POST /api/audit
// Appelle l'API Anthropic (Claude) et retourne un JSON d'analyse.
//
// Variables d'environnement requises :
//   ANTHROPIC_API_KEY — ta clé console.anthropic.com
// Optionnelles :
//   ANTHROPIC_MODEL   — défaut: "claude-haiku-4-5"

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return Response.json({ error: 'ANTHROPIC_API_KEY non configurée' }, { status: 500 });
  }

  try {
    const body = await req.json();
    const url = String(body?.url || '').trim().replace(/^https?:\/\//, '').replace(/\/$/, '');
    if (!url) {
      return Response.json({ error: 'URL manquante' }, { status: 400 });
    }
    // garde-fou : ressemble à un domaine
    if (!/^[a-z0-9.-]+\.[a-z]{2,}(\/.*)?$/i.test(url)) {
      return Response.json({ error: 'URL invalide' }, { status: 400 });
    }

    const prompt = `Tu es un auditeur web bienveillant mais rigoureux qui parle français, avec le tutoiement. Pour le site "${url}", imagine 3 améliorations très concrètes (pas génériques) qu'un développeur web indépendant recommanderait. Retourne STRICTEMENT un JSON de cette forme, sans markdown, sans backticks :
{"score": <nombre entre 55 et 92>, "summary": "<une phrase résumant la 1ère impression, ≤ 14 mots, ton chaleureux>", "improvements": [{"title": "<titre court, 3-6 mots>", "impact": "<élevé|moyen|faible>", "detail": "<explication concrète en 1-2 phrases, ton amical>"}, ...]}`;

    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: process.env.ANTHROPIC_MODEL || 'claude-haiku-4-5',
        max_tokens: 1024,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!resp.ok) {
      const errText = await resp.text();
      return Response.json({ error: 'Anthropic API error', detail: errText.slice(0, 300) }, { status: 502 });
    }

    const data = await resp.json();
    const text = data?.content?.[0]?.text || '';
    const m = text.match(/\{[\s\S]*\}/);
    if (!m) {
      return Response.json({ error: 'Réponse illisible du modèle' }, { status: 502 });
    }
    const parsed = JSON.parse(m[0]);
    parsed.url = url;
    return Response.json(parsed);
  } catch (e: any) {
    return Response.json({ error: 'Erreur serveur', detail: String(e?.message || e) }, { status: 500 });
  }
}
