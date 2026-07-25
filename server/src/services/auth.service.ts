import { prisma } from '../config/database.js';
import { AdminAction, AdminEntity } from '../generated/prisma/client.js';
import { AppError } from '../utils/AppError.js';
import { hashPassword, verifyPassword } from '../utils/password.js';
import type { ChangePasswordInput, LoginInput } from '../validators/auth.validators.js';
import { logAdminActivity } from './activity.service.js';

export type AuthenticatedOwner = {
  id: string;
  email: string;
};

export async function loginOwner(input: LoginInput): Promise<AuthenticatedOwner> {
  const owner = await prisma.owner.findUnique({
    where: { email: input.email.toLowerCase() },
  });

  if (!owner) {
    throw new AppError('Invalid email or password', 401);
  }

  const isValid = await verifyPassword(input.password, owner.password);

  if (!isValid) {
    throw new AppError('Invalid email or password', 401);
  }

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
    throw new AppError('Current password is incorrect', 400);
  }

  if (input.currentPassword === input.newPassword) {
    throw new AppError('New password must be different from the current password', 400);
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
