
import { Injectable, Logger } from '@nestjs/common';
import { PracticePaymentEmailDto } from './dto/mail.dto';
import { SendGridService } from './sendgrid.service';
import { magicLinkTemplate } from '../common/emailTemplates/magic-link.template';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly appUrl: string;
  private readonly appName: string;
  constructor(private readonly sendGridService: SendGridService) {
    this.appUrl = process.env.APP_URL ?? 'http://localhost:5173';
    this.appName = process.env.APP_NAME ?? 'Open-Dorse';
  }

  // private buildSignInUrl(email: string): string {
  //   const base = `${this.appUrl}/signin`;
  //   const params = new URLSearchParams({ email });
  //   return `${base}?${params.toString()}`;
  // }

 
private buildAuthUrl(
  path: string,
  params: Record<string, string>,
): string {
  const url = new URL(
    path,
    this.appUrl.endsWith('/')
      ? this.appUrl
      : `${this.appUrl}/`,
  );

  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  return url.toString();
}
  private escapeHtml(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  private async sendEmail(
    to: string,
    subject: string,
    text: string,
    html: string,
  ): Promise<void> {
    await this.sendGridService.sendEmail({ to, subject, text, html });
  }

  async sendTemporaryPassword(
    to: string,
    tempPassword: string,
  ): Promise<void> {
    const signInUrl = this.buildAuthUrl('/auth/reset-password', { email: to, tempPassword });
    const safeEmail = this.escapeHtml(to);
    const safePassword = this.escapeHtml(tempPassword);
    const safeUrl = this.escapeHtml(signInUrl);

    const subject = 'Your Open Dorse account is ready';

    const text = [
      'Hello,',
      '',
      'An account has been created for you on Open Dorse.',
      '',
      `Email: ${to}`,
      `Temporary password: ${tempPassword}`,
      '',
      'Click the link below to sign in. You will be asked to set a new password before accessing the app:',
      signInUrl,
      '',
      'If you did not expect this email, please contact support.',
    ].join('\n');

    const html = `
      <p>Hello,</p>
      <p>An account has been created for you on <strong>Open Dorse</strong>.</p>
      <p><strong>Email:</strong> ${safeEmail}<br/>
      <strong>Temporary password:</strong> <code>${safePassword}</code></p>
      <p><a href="${safeUrl}">Click here to sign in</a>.</p>
      <p>You will be asked to set a new password before accessing the app.</p>
      <p>If you did not expect this email, please contact support.</p>
    `;

    try {
      await this.sendEmail(to, subject, text, html);
      this.logger.log(`Temporary password email accepted by SendGrid for ${to}`);
    } catch (error) {
      this.logger.error(
        `Failed to send temporary password email to ${to}`,
        error instanceof Error ? error.stack : String(error),
      );
      throw error;
    }
  }

  async sendPasswordChanged(to: string): Promise<void> {
    const subject = 'Your Open Dorse password was changed';
    const text =
      'Your password was successfully changed. If this was not you, contact support immediately.';
    const html =
      '<p>Your password was successfully changed.</p>' +
      '<p>If this was not you, contact support immediately.</p>';

    try {
      await this.sendEmail(to, subject, text, html);
      this.logger.log(`Password-changed email accepted by SendGrid for ${to}`);
    } catch (error) {
      this.logger.error(
        `Failed to send password-changed email to ${to}`,
        error instanceof Error ? error.stack : String(error),
      );
      throw error;
    }
  }

  
async sendForgotPassword(
  email: string,
  rawAccessKey: string,
): Promise<void> {
  const resetUrl = this.buildAuthUrl(
    '/auth/change-password',
    {
      email,
      token: rawAccessKey,
    },
  );

  const safeUrl = this.escapeHtml(resetUrl);

  const subject = 'Reset your Open Dorse password';

  const text = [
    'Hello,',
    '',
    'We received a request to reset your Open Dorse account password.',
    '',
    'Use the following link to reset your password:',
    resetUrl,
    '',
    'This link expires in 24 hours and can only be used once.',
    'If you did not request a password reset, you can safely ignore this email.',
  ].join('\n');

  const html = `
    <p>Hello,</p>
    <p>We received a request to reset your
      <strong>Open Dorse</strong> account password.</p>
    <p>Use the link below to reset your password.</p>
    <p>
      <a href="${safeUrl}">Reset your Open Dorse password</a>
    </p>
    <p>This link expires in 1 hour and can only be used once.</p>
    <p>If you did not request a password reset,
      you can safely ignore this email.</p>
  `;

  try {
    await this.sendEmail(email, subject, text, html);
    this.logger.log(
      'Forgot-password email accepted by SendGrid',
    );
  } catch (error) {
    this.logger.error(
      'Failed to send forgot-password email',
      error instanceof Error ? error.stack : String(error),
    );
    throw error;
  }
}
  async sendPracticePaymentEmail(
    dto: PracticePaymentEmailDto,
  ): Promise<void> {
    const {
      recipientName,
      recipientEmail,
      practiceName,
      status,
      paymentLink,
    } = dto;

    const safeRecipientName = this.escapeHtml(recipientName);
    const safePracticeName = this.escapeHtml(practiceName);
    const safeStatus = this.escapeHtml(status);
    const safePaymentLink = this.escapeHtml(paymentLink);

    const subject =
      `New practice onboarding: payment required (${practiceName})`;

    const text = [
      `Hi ${recipientName},`,
      '',
      `A new practice is onboarding: ${practiceName}`,
      `Status: ${status}`,
      '',
      'Please proceed with the payment to continue to the next step:',
      paymentLink,
      '',
      'If you did not expect this email, please contact support.',
    ].join('\n');

    const html = `
      <p>Hi ${safeRecipientName},</p>
      <p>A new practice is onboarding: <strong>${safePracticeName}</strong></p>
      <p><strong>Status:</strong> ${safeStatus}</p>
      <p>Please proceed with the payment to continue to the next step.</p>
      <p><a href="${safePaymentLink}">Complete payment</a></p>
      <p>If you did not expect this email, please contact support.</p>
    `;

    try {
      await this.sendEmail(
        recipientEmail,
        subject,
        text,
        html,
      );

      this.logger.log(
        `Payment email accepted by SendGrid for ${recipientEmail}, practice ${practiceName}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send payment email to ${recipientEmail}`,
        error instanceof Error ? error.stack : String(error),
      );
      throw error;
    }
  }

  
async sendAccountActivation(
  email: string,
  rawAccessKey: string,
): Promise<void> {
  const activationUrl = this.buildAuthUrl(
    '/auth/activate-account',
    {
      email,
      token: rawAccessKey,
    },
  );

  const safeUrl = this.escapeHtml(activationUrl);

  const subject = 'Activate your Open Dorse account';

  const text = [
    'Hello,',
    '',
    'An account has been created for you on Open Dorse.',
    '',
    'Use the following link to activate your account and set your password:',
    activationUrl,
    '',
    'This link expires in 24 hours and can only be used once.',
    'If you did not expect this email, contact support.',
  ].join('\n');

  const html = `
    <p>Hello,</p>
    <p>An account has been created for you on
      <strong>Open Dorse</strong>.</p>
    <p>Use the link below to activate your account and set your password.</p>
    <p>
      <a href="${safeUrl}">Activate your Open Dorse account</a>
    </p>
    <p>This link expires in 24 hours and can only be used once.</p>
    <p>If you did not expect this email, contact support.</p>
  `;

  await this.sendEmail(email, subject, text, html);
  this.logger.log('Account activation email accepted by SendGrid');
}
async sendPracticeUserActivation(
  email: string,
  rawAccessKey: string,
  practiceName: string,
): Promise<void> {
  const activationUrl = this.buildAuthUrl(
    '/auth/activate-account',
    {
      email,
      token: rawAccessKey,
    },
  );

  const safeUrl = this.escapeHtml(activationUrl);
  const safePracticeName = this.escapeHtml(practiceName);

  const subject = 'Your Open Dorse practice is active';

  const text = [
    'Hello,',
    '',
    `Your practice "${practiceName}" has been successfully activated following your payment.`,
    '',
    'Please complete your Practice Manager signup using the link below.',
    'You can activate your account and set your password:',
    activationUrl,
    '',
    'This link expires in 7 days and can only be used once.',
    'If you did not expect this email, contact support.',
  ].join('\n');

  const html = `
    <p>Hello,</p>
    <p>Your practice <strong>${safePracticeName}</strong>
    has been successfully activated following your payment.</p>
    <p>Please complete your Practice Manager signup using the link below.</p>
    <p><a href="${safeUrl}">Complete your Open Dorse signup</a></p>
    <p>This link expires in 7 days and can only be used once.</p>
    <p>If you did not expect this email, contact support.</p>
  `;

  await this.sendEmail(email, subject, text, html);

  this.logger.log(
    `Practice activation email accepted by SendGrid for ${email}`,
  );
}

}

