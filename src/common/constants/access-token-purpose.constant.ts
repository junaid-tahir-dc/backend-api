
export const AccessTokenPurpose = {
  ACCOUNT_ACTIVATION: 'ACCOUNT_ACTIVATION',
  PASSWORD_RESET: 'PASSWORD_RESET',
} as const;

export type AccessTokenPurpose =
  (typeof AccessTokenPurpose)[keyof typeof AccessTokenPurpose];
