import { prisma } from '../config/database.js';
import { AdminAction, AdminEntity } from '../generated/prisma/client.js';
import { AppError } from '../utils/AppError.js';
import { hashPassword, verifyPassword } from '../utils/password.js';
import type { ChangePasswordInput, LoginInput } from '../validators/auth.validators.js';
import { logAdminActivity } from './activity.service.js';

export type AuthenticatedOwner = {
  id: string;
  email: string;
  tokenVersion: number;
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
    tokenVersion: owner.tokenVersion,
  };
}

export async function getOwnerById(ownerId: string): Promise<AuthenticatedOwner> {
  const owner = await prisma.owner.findUnique({
    where: { id: ownerId },
    select: { id: true, email: true, tokenVersion: true },
  });

  if (!owner) {
    throw new AppError('Authentication required', 401);
  }

  return owner;
}

export async function changeOwnerPassword(
  ownerId: string,
  input: ChangePasswordInput,
): Promise<AuthenticatedOwner> {
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

  const updated = await prisma.owner.update({
    where: { id: ownerId },
    data: {
      password: passwordHash,
      tokenVersion: { increment: 1 },
      passwordChangedAt: new Date(),
    },
    select: { id: true, email: true, tokenVersion: true },
  });

  await logAdminActivity({
    action: AdminAction.UPDATE,
    entity: AdminEntity.OWNER,
    entityId: ownerId,
    summary: 'Owner password updated',
  });

  return updated;
}
