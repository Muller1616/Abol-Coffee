import { authConfig } from '../config/auth.js';
import { prisma } from '../config/database.js';
import { AdminAction, AdminEntity } from '../generated/prisma/client.js';
import { AppError } from '../utils/AppError.js';
import {
  generateOtpCode,
  generateResetToken,
  hashOtp,
  hashResetToken,
  verifyOtpHash,
} from '../utils/otp.js';
import { hashPassword } from '../utils/password.js';
import type {
  ForgotPasswordInput,
  ResetPasswordInput,
  VerifyOtpInput,
} from '../validators/auth.validators.js';
import { logAdminActivity } from './activity.service.js';
import { sendPasswordResetOtpEmail } from './email.service.js';
import { invalidateOwnerAuthCache } from './ownerAuth.cache.js';

const ANTI_ENUMERATION_MESSAGE =
  'If an account exists with this email, a verification code has been sent.';

export type ForgotPasswordResult = {
  message: string;
  email: string;
  expiresAt: string | null;
  resendAvailableAt: string | null;
};

export type VerifyOtpResult = {
  resetToken: string;
  expiresAt: string;
  email: string;
};

async function cleanupExpiredOtps(email: string): Promise<void> {
  await prisma.passwordResetOtp.deleteMany({
    where: {
      email,
      OR: [{ expiresAt: { lt: new Date() } }, { used: true }, { invalidated: true }],
      createdAt: { lt: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    },
  });
}

function artificialDelay(): Promise<void> {
  const ms = 120 + Math.floor(Math.random() * 180);
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Request / resend a password-reset OTP.
 * Always returns the same anti-enumeration message whether or not the email exists.
 */
export async function requestPasswordResetOtp(
  input: ForgotPasswordInput,
): Promise<ForgotPasswordResult> {
  const email = input.email.trim().toLowerCase();
  await cleanupExpiredOtps(email);

  const owner = await prisma.owner.findUnique({ where: { email } });

  if (!owner) {
    await artificialDelay();
    const now = Date.now();
    return {
      message: ANTI_ENUMERATION_MESSAGE,
      email,
      // Synthetic timestamps so clients cannot enumerate accounts via timer fields.
      expiresAt: new Date(now + authConfig.otp.ttlMs).toISOString(),
      resendAvailableAt: new Date(now + authConfig.otp.resendCooldownMs).toISOString(),
    };
  }

  const latest = await prisma.passwordResetOtp.findFirst({
    where: { ownerId: owner.id, invalidated: false, used: false },
    orderBy: { createdAt: 'desc' },
  });

  if (latest) {
    const resendAt = latest.lastSentAt.getTime() + authConfig.otp.resendCooldownMs;
    if (Date.now() < resendAt) {
      const seconds = Math.ceil((resendAt - Date.now()) / 1000);
      throw new AppError(
        `Resend available in ${seconds} seconds.`,
        429,
        { errors: { email: `Resend available in ${seconds} seconds.` } },
      );
    }
  }

  // Invalidate every previous unused OTP for this owner.
  await prisma.passwordResetOtp.updateMany({
    where: { ownerId: owner.id, used: false, invalidated: false },
    data: { invalidated: true },
  });

  const otpCode = generateOtpCode(authConfig.otp.length);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + authConfig.otp.ttlMs);
  const otpHash = hashOtp(otpCode);

  await prisma.passwordResetOtp.create({
    data: {
      ownerId: owner.id,
      email,
      otpHash,
      expiresAt,
      lastSentAt: now,
    },
  });

  try {
    await sendPasswordResetOtpEmail({
      to: email,
      otpCode,
      expiresMinutes: Math.round(authConfig.otp.ttlMs / 60_000),
    });
  } catch (error) {
    await prisma.passwordResetOtp.updateMany({
      where: { ownerId: owner.id, otpHash, used: false },
      data: { invalidated: true },
    });
    throw new AppError(
      'Unable to send verification email. Please try again later.',
      503,
      { cause: error },
    );
  }

  return {
    message: ANTI_ENUMERATION_MESSAGE,
    email,
    expiresAt: expiresAt.toISOString(),
    resendAvailableAt: new Date(now.getTime() + authConfig.otp.resendCooldownMs).toISOString(),
  };
}

/**
 * Verify OTP and issue a short-lived password-reset session token.
 */
export async function verifyPasswordResetOtp(input: VerifyOtpInput): Promise<VerifyOtpResult> {
  const email = input.email.trim().toLowerCase();
  const otpCode = input.otpCode.trim();

  const owner = await prisma.owner.findUnique({ where: { email } });
  if (!owner) {
    throw AppError.field('otpCode', 'Invalid verification code.', 404);
  }

  const record = await prisma.passwordResetOtp.findFirst({
    where: {
      ownerId: owner.id,
      email,
      invalidated: false,
    },
    orderBy: { createdAt: 'desc' },
  });

  if (!record) {
    throw AppError.field(
      'otpCode',
      'Invalid verification code. Please request a new one.',
      404,
    );
  }

  if (record.used) {
    throw AppError.field('otpCode', 'This verification code has already been used.', 410);
  }

  if (record.expiresAt.getTime() <= Date.now()) {
    await prisma.passwordResetOtp.update({
      where: { id: record.id },
      data: { invalidated: true },
    });
    throw AppError.field(
      'otpCode',
      'This verification code has expired. Please request a new one.',
      410,
    );
  }

  if (record.attemptCount >= authConfig.otp.maxAttempts) {
    await prisma.passwordResetOtp.update({
      where: { id: record.id },
      data: { invalidated: true },
    });
    throw new AppError(
      'Too many incorrect attempts. Please request a new verification code.',
      429,
      { errors: { otpCode: 'Too many incorrect attempts. Please request a new verification code.' } },
    );
  }

  const matches = verifyOtpHash(otpCode, record.otpHash);

  if (!matches) {
    const nextAttempts = record.attemptCount + 1;
    const invalidate = nextAttempts >= authConfig.otp.maxAttempts;

    await prisma.passwordResetOtp.update({
      where: { id: record.id },
      data: {
        attemptCount: nextAttempts,
        ...(invalidate ? { invalidated: true } : {}),
      },
    });

    if (invalidate) {
      throw new AppError(
        'Too many incorrect attempts. Please request a new verification code.',
        429,
        {
          errors: {
            otpCode: 'Too many incorrect attempts. Please request a new verification code.',
          },
        },
      );
    }

    throw AppError.field('otpCode', 'Invalid verification code.', 400);
  }

  const now = new Date();

  await prisma.passwordResetOtp.update({
    where: { id: record.id },
    data: { used: true, usedAt: now },
  });

  // Invalidate any other leftover OTPs for this owner.
  await prisma.passwordResetOtp.updateMany({
    where: { ownerId: owner.id, id: { not: record.id }, used: false, invalidated: false },
    data: { invalidated: true },
  });

  // Invalidate previous unused reset sessions.
  await prisma.passwordResetSession.updateMany({
    where: { ownerId: owner.id, used: false },
    data: { used: true, usedAt: now },
  });

  const { rawToken, tokenHash } = generateResetToken();
  const expiresAt = new Date(now.getTime() + authConfig.passwordResetSessionTtlMs);

  await prisma.passwordResetSession.create({
    data: {
      ownerId: owner.id,
      tokenHash,
      expiresAt,
    },
  });

  return {
    resetToken: rawToken,
    expiresAt: expiresAt.toISOString(),
    email,
  };
}

/**
 * Complete password reset using the post-OTP session token.
 * Bumps tokenVersion so all existing login sessions become invalid.
 */
export async function resetPasswordWithSession(input: ResetPasswordInput): Promise<void> {
  const tokenHash = hashResetToken(input.resetToken);

  const session = await prisma.passwordResetSession.findUnique({
    where: { tokenHash },
    include: { owner: true },
  });

  if (!session) {
    throw new AppError('Invalid or expired reset session. Please restart password recovery.', 401);
  }

  if (session.used) {
    throw new AppError('This reset session has already been used. Please sign in or request a new code.', 410);
  }

  if (session.expiresAt.getTime() <= Date.now()) {
    await prisma.passwordResetSession.update({
      where: { id: session.id },
      data: { used: true, usedAt: new Date() },
    });
    throw new AppError('Your reset session has expired. Please request a new verification code.', 410);
  }

  const passwordHash = await hashPassword(input.newPassword);
  const now = new Date();

  await prisma.$transaction([
    prisma.owner.update({
      where: { id: session.ownerId },
      data: {
        password: passwordHash,
        tokenVersion: { increment: 1 },
        passwordChangedAt: now,
      },
    }),
    prisma.passwordResetSession.update({
      where: { id: session.id },
      data: { used: true, usedAt: now },
    }),
    prisma.passwordResetSession.updateMany({
      where: { ownerId: session.ownerId, used: false, id: { not: session.id } },
      data: { used: true, usedAt: now },
    }),
    prisma.passwordResetOtp.updateMany({
      where: { ownerId: session.ownerId, used: false, invalidated: false },
      data: { invalidated: true },
    }),
  ]);

  await logAdminActivity({
    action: AdminAction.UPDATE,
    entity: AdminEntity.OWNER,
    entityId: session.ownerId,
    summary: 'Owner password reset via email OTP verification',
  });

  invalidateOwnerAuthCache(session.ownerId);
}
