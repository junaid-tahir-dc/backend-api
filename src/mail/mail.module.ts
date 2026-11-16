import { Global, Module } from '@nestjs/common';
import { MailService } from './mail.service';
import { SendGridService } from './sendgrid.service';

@Global()
@Module({
  providers: [MailService,SendGridService],
  exports: [MailService],
})
export class MailModule {}