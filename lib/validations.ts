import { z } from "zod";

// Turkce hata mesajlari
const messages = {
  required: "Bu alan zorunludur",
  email: "Gecerli bir e-posta adresi girin",
  phone: "Gecerli bir telefon numarasi girin (ornek: +90 5XX XXX XX XX)",
  url: "Gecerli bir URL girin (ornek: https://example.com)",
  password: {
    min: "Sifre en az 8 karakter olmalidir",
    uppercase: "Sifre en az bir buyuk harf icermeli",
    lowercase: "Sifre en az bir kucuk harf icermeli",
    number: "Sifre en az bir rakam icermeli",
    special: "Sifre en az bir ozel karakter icermeli (!@#$%^&*)",
  },
  taxNumber: "Gecerli bir vergi numarasi girin (10 veya 11 haneli)",
  username: "Kullanici adi sadece harf, rakam ve alt cizgi icerebilir",
  minLength: (min: number) => `En az ${min} karakter olmalidir`,
  maxLength: (max: number) => `En fazla ${max} karakter olmalidir`,
  min: (min: number) => `En az ${min} olmalidir`,
  max: (max: number) => `En fazla ${max} olmalidir`,
  positive: "Pozitif bir deger girin",
  integer: "Tam sayi girin",
  passwordMismatch: "Sifreler eslesmiyor",
};

// ==================== TEMEL SCHEMALAR ====================

// E-posta validasyonu
export const emailSchema = z
  .string({ message: messages.required })
  .min(1, { message: messages.required })
  .email({ message: messages.email })
  .toLowerCase()
  .trim();

// Telefon validasyonu (Turkiye + Uluslararasi)
const phoneRegex = /^(\+?[1-9]\d{0,2}[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{2}[\s.-]?\d{2}$|^(\+?[1-9]\d{0,2}[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}$/;

export const phoneSchema = z
  .string({ message: messages.required })
  .min(1, { message: messages.required })
  .regex(phoneRegex, { message: messages.phone })
  .transform((val) => val.replace(/[\s.-]/g, ""));

// Guclu sifre validasyonu
export const passwordSchema = z
  .string({ message: messages.required })
  .min(8, { message: messages.password.min })
  .refine((val) => /[A-Z]/.test(val), { message: messages.password.uppercase })
  .refine((val) => /[a-z]/.test(val), { message: messages.password.lowercase })
  .refine((val) => /[0-9]/.test(val), { message: messages.password.number })
  .refine((val) => /[!@#$%^&*(),.?":{}|<>]/.test(val), { message: messages.password.special });

// Basit sifre (mevcut sifre girisi icin)
export const passwordSimpleSchema = z
  .string({ message: messages.required })
  .min(1, { message: messages.required });

// Kullanici adi validasyonu
const usernameRegex = /^[a-zA-Z0-9_]+$/;

export const usernameSchema = z
  .string({ message: messages.required })
  .min(3, { message: messages.minLength(3) })
  .max(30, { message: messages.maxLength(30) })
  .regex(usernameRegex, { message: messages.username });

// Zorunlu text alani
export const requiredStringSchema = (minLength = 1, maxLength?: number) => {
  let schema = z
    .string({ message: messages.required })
    .min(minLength, { message: minLength === 1 ? messages.required : messages.minLength(minLength) })
    .trim();

  if (maxLength) {
    schema = schema.max(maxLength, { message: messages.maxLength(maxLength) });
  }

  return schema;
};

// Fiyat validasyonu
export const priceSchema = z
  .number({ message: messages.required })
  .positive({ message: messages.positive })
  .min(0.01, { message: messages.min(0.01) });

// Stok miktari
export const stockSchema = z
  .number({ message: messages.required })
  .int({ message: messages.integer })
  .min(0, { message: messages.min(0) });

// ==================== FORM SCHEMALARI ====================

// Login formu
export const loginFormSchema = z.object({
  email: emailSchema,
  password: passwordSimpleSchema,
});

// Register formu
export const registerFormSchema = z.object({
  email: emailSchema,
  username: usernameSchema,
  password: passwordSchema,
  confirmPassword: z.string({ message: messages.required }).min(1, { message: messages.required }),
  firstName: requiredStringSchema(2, 50),
  surname: requiredStringSchema(2, 50),
}).refine((data) => data.password === data.confirmPassword, {
  message: messages.passwordMismatch,
  path: ["confirmPassword"],
});

// Sifre sifirlama formu
export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

// Yeni sifre belirleme formu
export const resetPasswordSchema = z.object({
  password: passwordSchema,
  confirmPassword: z.string({ message: messages.required }).min(1, { message: messages.required }),
}).refine((data) => data.password === data.confirmPassword, {
  message: messages.passwordMismatch,
  path: ["confirmPassword"],
});

// Sifre degistirme formu
export const changePasswordSchema = z.object({
  currentPassword: passwordSimpleSchema,
  newPassword: passwordSchema,
  confirmPassword: z.string({ message: messages.required }).min(1, { message: messages.required }),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: messages.passwordMismatch,
  path: ["confirmPassword"],
}).refine((data) => data.currentPassword !== data.newPassword, {
  message: "Yeni sifre mevcut sifreden farkli olmalidir",
  path: ["newPassword"],
});

// Profil formu
export const profileFormSchema = z.object({
  firstName: requiredStringSchema(2, 50),
  surname: requiredStringSchema(2, 50),
  phoneNumber: z.string().optional().refine(
    (val) => !val || val.length === 0 || phoneRegex.test(val),
    { message: messages.phone }
  ),
  countryId: z.number().optional(),
  language: z.string().min(2).max(5),
  preferredCurrencyCode: z.string().min(3).max(3),
});

// Satici ol formu
export const becomeSellerFormSchema = z.object({
  businessName: requiredStringSchema(2, 100),
  businessType: z.enum(["individual", "company", "cooperative", "farm"], {
    message: messages.required,
  }),
  taxNumber: z.string().optional().refine(
    (val) => !val || val.length === 0 || /^\d{10,11}$/.test(val),
    { message: messages.taxNumber }
  ),
  description: z.string().max(1000, { message: messages.maxLength(1000) }).optional(),
  phone: phoneSchema,
  website: z.string().optional().refine(
    (val) => !val || val.length === 0 || /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([\/\w .-]*)*\/?$/.test(val),
    { message: messages.url }
  ),
});

// Ilan olusturma/duzenleme formu
export const listingFormSchema = z.object({
  title: requiredStringSchema(5, 200),
  shortDescription: requiredStringSchema(10, 500),
  description: requiredStringSchema(20, 5000),
  categoryId: z.string({ message: messages.required }).min(1, { message: messages.required }),
  basePrice: priceSchema,
  discountedPrice: z.number().positive({ message: messages.positive }).optional(),
  currency: z.string().min(3).max(3).default("TRY"),
  stockQuantity: stockSchema,
  condition: z.number().min(0).max(3),
  brandId: z.string().optional(),
  tags: z.array(z.string()).optional(),
}).refine((data) => {
  if (data.discountedPrice && data.discountedPrice >= data.basePrice) {
    return false;
  }
  return true;
}, {
  message: "Indirimli fiyat normal fiyattan dusuk olmalidir",
  path: ["discountedPrice"],
});

// Iletisim formu
export const contactFormSchema = z.object({
  name: requiredStringSchema(2, 100),
  email: emailSchema,
  phone: z.string().optional().refine(
    (val) => !val || val.length === 0 || phoneRegex.test(val),
    { message: messages.phone }
  ),
  subject: requiredStringSchema(5, 200),
  message: requiredStringSchema(20, 2000),
});

// ==================== TYPE EXPORTS ====================

export type LoginFormData = z.infer<typeof loginFormSchema>;
export type RegisterFormData = z.infer<typeof registerFormSchema>;
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;
export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;
export type ProfileFormData = z.infer<typeof profileFormSchema>;
export type BecomeSellerFormData = z.infer<typeof becomeSellerFormSchema>;
export type ListingFormData = z.infer<typeof listingFormSchema>;
export type ContactFormData = z.infer<typeof contactFormSchema>;

// ==================== HELPER FUNCTIONS ====================

// Telefon numarasini formatla (gosterim icin)
export const formatPhoneDisplay = (phone: string): string => {
  if (!phone) return "";

  // Sadece rakamlari al
  const digits = phone.replace(/\D/g, "");

  // Turkiye formati
  if (digits.startsWith("90") && digits.length === 12) {
    return `+90 ${digits.slice(2, 5)} ${digits.slice(5, 8)} ${digits.slice(8, 10)} ${digits.slice(10)}`;
  }

  // 0 ile baslayan Turkiye formati
  if (digits.startsWith("0") && digits.length === 11) {
    return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7, 9)} ${digits.slice(9)}`;
  }

  // Diger formatlar
  return phone;
};
