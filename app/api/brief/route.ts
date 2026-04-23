// Route Handler — POST /api/brief
// Reçoit un brief du formulaire et l'envoie par email via Resend.
//
// Variables d'environnement requises :
//   RESEND_API_KEY  — ta clé resend.com (gratuit jusqu'à 100 emails/jour)
//   CONTACT_EMAIL   — l'email qui recevra les briefs (ex: joran.vanpeene@gmail.com)
// Optionnelles :
//   FROM_EMAIL      — défaut "onboarding@resend.dev" (à changer pour une adresse vérifiée sur ton domaine)

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

const escape = (s: any) =>
  String(s || '').replace(/[<>&]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' } as const)[c as '<' | '>' | '&']);

export async function POST(req: Request) {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_EMAIL;
  const from = process.env.FROM_EMAIL || 'onboarding@resend.dev';

  if (!apiKey || !to) {
    return Response.json({ error: 'RESEND_API_KEY ou CONTACT_EMAIL non configurés' }, { status: 500 });
  }

  try {
    const body = await req.json();
    const { type, goals, context, details, email } = body || {};

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email))) {
      return Response.json({ error: 'Email invalide' }, { status: 400 });
    }

    const html = `
      <div style="font-family:-apple-system,BlinkMacSystemFont,sans-serif;max-width:560px;color:#1a1a1a;">
        <h2 style="margin:0 0 18px;font-size:22px;">Nouveau brief reçu</h2>
        <table style="width:100%;border-collapse:collapse;font-size:14px;line-height:1.6">
          <tr><td style="padding:10px 0;border-bottom:1px solid #eee;font-weight:600;width:120px;">Email</td><td style="padding:10px 0;border-bottom:1px solid #eee;">${escape(email)}</td></tr>
          <tr><td style="padding:10px 0;border-bottom:1px solid #eee;font-weight:600;">Type de projet</td><td style="padding:10px 0;border-bottom:1px solid #eee;">${escape(type)}</td></tr>
          <tr><td style="padding:10px 0;border-bottom:1px solid #eee;font-weight:600;">Objectifs</td><td style="padding:10px 0;border-bottom:1px solid #eee;">${escape(Array.isArray(goals) ? goals.join(', ') : goals)}</td></tr>
          <tr><td style="padding:10px 0;border-bottom:1px solid #eee;font-weight:600;">Contexte</td><td style="padding:10px 0;border-bottom:1px solid #eee;">${escape(context)}</td></tr>
          <tr><td style="padding:10px 0;vertical-align:top;font-weight:600;">Détails</td><td style="padding:10px 0;white-space:pre-wrap;">${escape(details) || '<em style="color:#888">Aucun détail fourni</em>'}</td></tr>
        </table>
        <p style="margin-top:24px;font-size:12px;color:#888;">Envoyé depuis joran-vanpeene.fr</p>
      </div>
    `;

    const resp = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `Portfolio <${from}>`,
        to: [to],
        reply_to: email,
        subject: `Brief — ${type || 'Nouveau projet'}`,
        html,
      }),
    });

    if (!resp.ok) {
      const err = await resp.text();
      return Response.json({ error: 'Resend API error', detail: err.slice(0, 300) }, { status: 502 });
    }

    return Response.json({ ok: true });
  } catch (e: any) {
    return Response.json({ error: 'Erreur serveur', detail: String(e?.message || e) }, { status: 500 });
  }
}
