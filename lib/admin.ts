const ADMIN_EMAILS = [
  "nagehanyazici13@gmail.com",
  "m.mustafaocak@gmail.com",
];

export function isAdminEmail(email: string | undefined): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.toLowerCase());
}
