import { prisma } from '../config/database.js';
import { AdminAction, AdminEntity } from '../generated/prisma/client.js';
import { AppError } from '../utils/AppError.js';
import { hashPassword, verifyPassword } from '../utils/password.js';
import type {
  ChangePasswordInput,
  LoginInput,
  ResetWithOtpInput,
  SendOtpInput,
} from '../validators/auth.validators.js';
import { logAdminActivity } from './activity.service.js';

type OtpRecord = {
  code: string;
  expiresAt: number;
};

const otpStore = new Map<string, OtpRecord>();

export type AuthenticatedOwner = {
  id: string;
  email: string;
};

export async function loginOwner(input: LoginInput): Promise<AuthenticatedOwner> {
  const owner = await prisma.owner.findUnique({
    where: { email: input.email.toLowerCase() },
  });

  if (!owner) {
    throw AppError.field('email', 'No owner account found with this email.', 401);
  }

  const isValid = await verifyPassword(input.password, owner.password);

  if (!isValid) {
    throw AppError.field('password', 'Incorrect password.', 401);
  }

  await logAdminActivity({
    action: AdminAction.LOGIN,
    entity: AdminEntity.OWNER,
    entityId: owner.id,
    summary: `Owner signed in (${owner.email})`,
  });

  return {
    id: owner.id,
    email: owner.email,
  };
}

export async function getOwnerById(ownerId: string): Promise<AuthenticatedOwner> {
  const owner = await prisma.owner.findUnique({
    where: { id: ownerId },
    select: { id: true, email: true },
  });

  if (!owner) {
    throw new AppError('Authentication required', 401);
  }

  return owner;
}

export async function changeOwnerPassword(
  ownerId: string,
  input: ChangePasswordInput,
): Promise<void> {
  const owner = await prisma.owner.findUnique({
    where: { id: ownerId },
  });

  if (!owner) {
    throw new AppError('Authentication required', 401);
  }

  const isCurrentValid = await verifyPassword(input.currentPassword, owner.password);

  if (!isCurrentValid) {
    throw AppError.field('currentPassword', 'Current password is incorrect.');
  }

  if (input.currentPassword === input.newPassword) {
    throw AppError.field(
      'newPassword',
      'New password must be different from the current password.',
    );
  }

  const passwordHash = await hashPassword(input.newPassword);

  await prisma.owner.update({
    where: { id: ownerId },
    data: { password: passwordHash },
  });

  await logAdminActivity({
    action: AdminAction.UPDATE,
    entity: AdminEntity.OWNER,
    entityId: ownerId,
    summary: 'Owner password updated',
  });
}

export async function sendOwnerOtp(input: SendOtpInput): Promise<{ email: string; otpCode: string }> {
  const normalizedEmail = input.email.trim().toLowerCase();
  const owner = await prisma.owner.findUnique({
    where: { email: normalizedEmail },
  });

  if (!owner) {
    throw AppError.field('email', 'No owner account found with this email.', 404);
  }

  // Generate 6-digit numeric OTP code
  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes TTL

  otpStore.set(normalizedEmail, { code: otpCode, expiresAt });

  // Development aid only — never log OTP codes in production.
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[OTP SENT] Sent OTP verification code ${otpCode} to ${normalizedEmail}`);
  }

  return { email: normalizedEmail, otpCode };
}

export async function resetOwnerPasswordWithOtp(input: ResetWithOtpInput): Promise<void> {
  const normalizedEmail = input.email.trim().toLowerCase();
  const owner = await prisma.owner.findUnique({
    where: { email: normalizedEmail },
  });

  if (!owner) {
    throw AppError.field('email', 'No owner account found with this email.', 404);
  }

  const record = otpStore.get(normalizedEmail);

  if (!record || record.expiresAt < Date.now()) {
    throw AppError.field(
      'otpCode',
      'OTP code has expired or is invalid. Please request a new code.',
    );
  }

  if (record.code !== input.otpCode.trim()) {
    throw AppError.field(
      'otpCode',
      'Incorrect OTP verification code. Please check and try again.',
    );
  }

  const passwordHash = await hashPassword(input.newPassword);

  await prisma.owner.update({
    where: { id: owner.id },
    data: { password: passwordHash },
  });

  otpStore.delete(normalizedEmail);

  await logAdminActivity({
    action: AdminAction.UPDATE,
    entity: AdminEntity.OWNER,
    entityId: owner.id,
    summary: 'Owner password reset using OTP verification code',
  });
}
