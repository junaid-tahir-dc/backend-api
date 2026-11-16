
export interface MagicLinkTemplateData {
  loginUrl: string;
  expiresInMinutes: number;
}

const appName = process.env.APP_NAME ?? 'Gut-Glo';

export function magicLinkTemplate(data: MagicLinkTemplateData) {
  const subject = `Your ${appName} magic sign-in link`;

  const escapeHtml = (value: string) =>
    value.replace(/[&<>"']/g, (char) => {
      const entities: Record<string, string> = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
      };

      return entities[char];
    });

  const safeUrl = escapeHtml(data.loginUrl);
  const safeAppName = escapeHtml(appName);

  const text = [
    'Hello,',
    '',
    `You requested a passwordless sign-in to ${appName}.`,
    '',
    'Click the magic link below to securely access your account:',
    data.loginUrl,
    '',
    `This magic link expires in ${data.expiresInMinutes} minutes and can only be used once.`,
    '',
    'If you did not request this magic link, you can safely ignore this email.',
  ].join('\n');

  const html = `
    <div>
      <p>Hello,</p>

      <p>
        You requested a passwordless sign-in to
        <strong>${safeAppName}</strong>.
      </p>

      <p>Click the link below to securely access your account:</p>

      <p>
        <a href="${safeUrl}">
          Sign in with Magic Link
        </a>
      </p>

      <p>
        This magic link expires in ${data.expiresInMinutes} minutes
        and can only be used once.
      </p>

      <p>
        If you did not request this magic link,
        you can safely ignore this email.
      </p>
    </div>
  `;

  return { subject, text, html };
}
