export interface PracticeContactDTO {
  contactType: string;
  email?: string;
  firstName?: string;
  lastName?: string;
}

export interface PracticePaymentInfoDTO {
  id: string;
  name: string;
  status: string;
  paymentLink: string;
  contacts: PracticeContactDTO[];
}
export interface PracticePaymentEmailDto {
  recipientName: string;
  recipientEmail: string;
  practiceName: string;
  status: string;
  paymentLink: string;
}