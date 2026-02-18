"use client";

import { useState, useEffect, useMemo } from "react";
import { getUserRoles, hasRole, hasAnyRole } from "@/utils/jwt";
import { Roles } from "@/constants/roles";

export const useRoles = () => {
  const [roles, setRoles] = useState<string[]>([]);

  useEffect(() => {
    setRoles(getUserRoles());
  }, []);

  const permissions = useMemo(
    () => ({
      isAdmin: hasRole(Roles.Admin),
      isModerator: hasRole(Roles.Moderator),
      isSupport: hasRole(Roles.Support),
      isSeller: hasRole(Roles.Seller),
      isTransporter: hasRole(Roles.Transporter),
      isBuyer: hasRole(Roles.Buyer),
      isVeterinarian: hasRole(Roles.Veterinarian),
      isStaff: hasAnyRole([Roles.Admin, Roles.Moderator, Roles.Support]),
      canManageProducts: hasAnyRole([
        Roles.Admin,
        Roles.Moderator,
        Roles.Seller,
      ]),
      canManageOrders: hasAnyRole([Roles.Admin, Roles.Moderator]),
      canManageUsers: hasRole(Roles.Admin),
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [roles]
  );

  return {
    roles,
    ...permissions,
    hasRole,
    hasAnyRole,
  };
};
