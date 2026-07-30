import 'dotenv/config';
import { authConfig } from '../src/config/auth.js';
import { prisma } from '../src/config/database.js';
import {
  resetPasswordWithSession,
  verifyPasswordResetOtp,
} from '../src/services/password-reset.service.js';
import { generateOtpCode, hashOtp, verifyOtpHash } from '../src/utils/otp.js';

async function main() {
  const code = generateOtpCode(6);
  const hash = hashOtp(code);
  if (code.length !== 6 || !verifyOtpHash(code, hash) || verifyOtpHash('000000', hash)) {
    throw new Error('OTP util self-check failed');
  }

  const email = (process.env.OWNER_EMAIL ?? 'habeshadreamer12@gmail.com').trim().toLowerCase();
  const owner = await prisma.owner.findUnique({ where: { email } });
  if (!owner) throw new Error(`Owner not found: ${email}`);

  await prisma.passwordResetOtp.updateMany({
    where: { ownerId: owner.id },
    data: { invalidated: true },
  });

  const otp = generateOtpCode(6);
  const now = new Date();
  await prisma.passwordResetOtp.create({
    data: {
      ownerId: owner.id,
      email,
      otpHash: hashOtp(otp),
      expiresAt: new Date(now.getTime() + authConfig.otp.ttlMs),
      lastSentAt: new Date(now.getTime() - authConfig.otp.resendCooldownMs - 1000),
    },
  });

  const verified = await verifyPasswordResetOtp({ email, otpCode: otp });
  await resetPasswordWithSession({
    resetToken: verified.resetToken,
    newPassword: 'ChangeMe123!',
    confirmPassword: 'ChangeMe123!',
  });

  let reuseMessage = '';
  try {
    await verifyPasswordResetOtp({ email, otpCode: otp });
  } catch (error) {
    reuseMessage = error instanceof Error ? error.message : String(error);
  }

  const ownerAfter = await prisma.owner.findUnique({ where: { email } });
  console.log(
    JSON.stringify(
      {
        ok: true,
        reuseBlocked: Boolean(reuseMessage),
        tokenVersion: ownerAfter?.tokenVersion,
      },
      null,
      2,
    ),
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
