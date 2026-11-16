
import { Injectable, Logger } from '@nestjs/common';
import sgMail from '@sendgrid/mail';

@Injectable()
export class SendGridService {
  private readonly logger = new Logger(SendGridService.name);
  private readonly from: { email: string; name: string };

  constructor() {
    const apiKey = process.env.SENDGRID_API_KEY;
    const email = process.env.SENDGRID_FROM_EMAIL;
    const name = process.env.SENDGRID_FROM_NAME ?? 'Gut-Glo';

    if (!apiKey) {
      throw new Error('SENDGRID_API_KEY is required');
    }

    if (!email) {
      throw new Error('SENDGRID_FROM_EMAIL is required');
    }

    sgMail.setApiKey(apiKey);

    this.from = { email, name };
  }

  async sendEmail(params: {
    to: string;
    subject: string;
    text: string;
    html: string;
  }): Promise<void> {
    try {
      await sgMail.send({
        from: this.from,
        to: params.to,
        subject: params.subject,
        text: params.text,
        html: params.html,
      });
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : String(error);

      this.logger.error(`SendGrid delivery failed: ${message}`);
      throw error;
    }
  }
}