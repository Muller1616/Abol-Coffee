import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import { env, isSmtpConfigured } from '../config/env.js';
import { AppError } from '../utils/AppError.js';
import { logger } from '../utils/logger.js';

let transporterPromise: Promise<Transporter> | null = null;

async function getTransporter(): Promise<Transporter> {
  if (!transporterPromise) {
    transporterPromise = (async () => {
      if (isSmtpConfigured()) {
        return nodemailer.createTransport({
          host: env.SMTP_HOST,
          port: env.SMTP_PORT,
          secure: env.SMTP_SECURE ?? env.SMTP_PORT === 465,
          auth:
            env.SMTP_USER && env.SMTP_PASS
              ? { user: env.SMTP_USER, pass: env.SMTP_PASS }
              : undefined,
        });
      }

      if (env.NODE_ENV === 'production') {
        throw new AppError(
          'Email delivery is not configured. Password reset is unavailable.',
          503,
        );
      }

      // Development fallback: JSON transport (OTP logged once without secrets dump of full MIME).
      return nodemailer.createTransport({ jsonTransport: true });
    })();
  }

  return transporterPromise;
}

function buildPasswordResetEmailHtml(otpCode: string, expiresMinutes: number): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Password Reset Verification Code</title>
</head>
<body style="margin:0;padding:0;background:#0b1411;font-family:Georgia,'Times New Roman',serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0b1411;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:24px;overflow:hidden;">
          <tr>
            <td style="background:linear-gradient(135deg,#059669,#10b981);padding:28px 32px;">
              <p style="margin:0;font-family:system-ui,-apple-system,sans-serif;font-size:13px;letter-spacing:0.08em;text-transform:uppercase;color:rgba(255,255,255,0.85);">Abol Coffee</p>
              <h1 style="margin:8px 0 0;font-family:system-ui,-apple-system,sans-serif;font-size:22px;line-height:1.3;color:#ffffff;">Password Reset Verification Code</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              <p style="margin:0 0 16px;font-family:system-ui,-apple-system,sans-serif;font-size:15px;line-height:1.6;color:#334155;">Hello,</p>
              <p style="margin:0 0 24px;font-family:system-ui,-apple-system,sans-serif;font-size:15px;line-height:1.6;color:#334155;">
                We received a request to reset your password.
              </p>
              <p style="margin:0 0 12px;font-family:system-ui,-apple-system,sans-serif;font-size:14px;color:#64748b;">Your verification code is:</p>
              <p style="margin:0 0 24px;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:36px;letter-spacing:0.28em;font-weight:700;color:#0f172a;text-align:center;background:#f1f5f9;border-radius:16px;padding:20px 12px;">
                ${otpCode}
              </p>
              <p style="margin:0 0 8px;font-family:system-ui,-apple-system,sans-serif;font-size:14px;line-height:1.6;color:#334155;">
                This code expires in <strong>${expiresMinutes} minutes</strong>.
              </p>
              <p style="margin:0 0 8px;font-family:system-ui,-apple-system,sans-serif;font-size:14px;line-height:1.6;color:#334155;">
                It can only be used once.
              </p>
              <p style="margin:0 0 24px;font-family:system-ui,-apple-system,sans-serif;font-size:14px;line-height:1.6;color:#334155;">
                If you did not request this password reset, you can safely ignore this email.
              </p>
              <p style="margin:0;font-family:system-ui,-apple-system,sans-serif;font-size:13px;line-height:1.6;color:#94a3b8;">
                Do not share this code with anyone.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:0 32px 28px;">
              <p style="margin:0;font-family:system-ui,-apple-system,sans-serif;font-size:13px;color:#64748b;">
                Regards,<br /><strong style="color:#0f172a;">Restaurant Menu System</strong>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function buildPasswordResetEmailText(otpCode: string, expiresMinutes: number): string {
  return `Hello,

We received a request to reset your password.

Your verification code is:

${otpCode}

This code expires in ${expiresMinutes} minutes.

It can only be used once.

If you did not request this password reset, you can safely ignore this email.

Do not share this code with anyone.

Regards,
Restaurant Menu System`;
}

export async function sendPasswordResetOtpEmail(options: {
  to: string;
  otpCode: string;
  expiresMinutes: number;
}): Promise<void> {
  const transporter = await getTransporter();
  const from = env.SMTP_FROM ?? 'Abol Coffee <noreply@abolcoffee.local>';

  await transporter.sendMail({
    from,
    to: options.to,
    subject: 'Password Reset Verification Code',
    text: buildPasswordResetEmailText(options.otpCode, options.expiresMinutes),
    html: buildPasswordResetEmailHtml(options.otpCode, options.expiresMinutes),
  });

  if (!isSmtpConfigured()) {
    // Development-only: surface the code so local password reset can be tested without SMTP.
    logger.info('Password reset OTP issued (SMTP not configured — development only)', {
      to: options.to,
      otpCode: options.otpCode,
      expiresMinutes: options.expiresMinutes,
    });
  } else {
    logger.info('Password reset OTP email sent', { to: options.to });
  }
}
