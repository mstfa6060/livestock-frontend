"use client";

import { useState, useEffect, useMemo } from "react";
import { getUserRoles, hasRole, hasAnyRole } from "@/lib/jwt";
import { Roles } from "@/constants/roles";

export const useRoles = () => {
  const [roles, setRoles] = useState<string[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setRoles(getUserRoles());
    setIsLoaded(true);
  }, []);

  const permissions = useMemo(
    () => ({
      isAdmin: roles.includes(Roles.Admin),
      isModerator: roles.includes(Roles.Moderator),
      isSupport: roles.includes(Roles.Support),
      isSeller: roles.includes(Roles.Seller),
      isTransporter: roles.includes(Roles.Transporter),
      isBuyer: roles.includes(Roles.Buyer),
      isVeterinarian: roles.includes(Roles.Veterinarian),
      isStaff: [Roles.Admin, Roles.Moderator, Roles.Support].some((r) => roles.includes(r)),
      canManageProducts: [Roles.Admin, Roles.Moderator, Roles.Seller].some((r) => roles.includes(r)),
      canManageOrders: [Roles.Admin, Roles.Moderator].some((r) => roles.includes(r)),
      canManageUsers: roles.includes(Roles.Admin),
    }),
    [roles]
  );

  return {
    roles,
    isLoaded,
    ...permissions,
    hasRole,
    hasAnyRole,
  };
};
