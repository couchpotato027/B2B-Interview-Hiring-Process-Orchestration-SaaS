'use client';

import React from 'react';
import { usePermission, Resource, Action } from '@/lib/permissions';

interface PermissionGuardProps {
  resource: Resource;
  action: Action;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * Conditionally renders children if the user has the required permission.
 */
export function PermissionGuard({ resource, action, children, fallback = null }: PermissionGuardProps) {
  const isAllowed = usePermission(resource, action);

  if (!isAllowed) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
