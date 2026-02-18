export const Roles = {
  Admin: "LivestockTrading.Admin",
  Moderator: "LivestockTrading.Moderator",
  Support: "LivestockTrading.Support",
  Seller: "LivestockTrading.Seller",
  Transporter: "LivestockTrading.Transporter",
  Buyer: "LivestockTrading.Buyer",
  Veterinarian: "LivestockTrading.Veterinarian",
} as const;

export const AdminRoles = [Roles.Admin];
export const StaffRoles = [Roles.Admin, Roles.Moderator, Roles.Support];
export const SellerRoles = [Roles.Admin, Roles.Moderator, Roles.Seller];
export const TransporterRoles = [
  Roles.Admin,
  Roles.Moderator,
  Roles.Transporter,
];
