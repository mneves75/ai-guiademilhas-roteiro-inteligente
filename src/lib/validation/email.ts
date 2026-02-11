import { z } from 'zod';

const emailSchema = z.string().trim().email();

export function isValidEmail(value: string): boolean {
  return emailSchema.safeParse(value).success;
}
