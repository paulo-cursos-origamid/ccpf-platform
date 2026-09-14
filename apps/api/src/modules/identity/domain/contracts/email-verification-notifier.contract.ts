export interface EmailVerificationNotifierContract {
  sendVerificationEmail(input: {
    email: string;
    name: string;
    verificationToken: string;
  }): Promise<void>;
}

export const EmailVerificationNotifierContract = Symbol(
  'EmailVerificationNotifierContract',
);
