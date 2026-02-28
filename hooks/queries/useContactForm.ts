import { useMutation } from "@tanstack/react-query";
import { api, AppConfig } from "@/config/livestock-config";

interface ContactFormData {
  name: string;
  email: string;
  subject: string;
  message: string;
  phone?: string;
  userId?: string;
}

interface ContactFormResponse {
  id: string;
  ticketNumber: string;
  createdAt: string;
}

export function useContactFormMutation() {
  return useMutation({
    mutationFn: (data: ContactFormData) =>
      api.post<{ payload: ContactFormResponse }>(
        `${AppConfig.LivestockTradingUrl}/ContactMessages/Create`,
        data
      ).then((res) => res.data.payload),
  });
}
