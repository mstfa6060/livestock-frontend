import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// ─── Mocks ──────────────────────────────────────────────────────────

// Mock next-intl
vi.mock("next-intl", () => ({
  useTranslations: () => {
    const translations: Record<string, string> = {
      makeOffer: "Make Offer",
      cancel: "Cancel",
      sendOffer: "Send Offer",
      sending: "Sending...",
      yourOffer: "Your Offer",
      quantity: "Quantity",
      messageOptional: "Message (optional)",
      messagePlaceholder: "Write a message to the seller...",
      listingPrice: "Listing Price",
      offerSent: "Offer sent successfully",
      offerError: "Failed to send offer",
      loginRequired: "Please login to make an offer",
      invalidPrice: "Please enter a valid price",
      invalidQuantity: "Please enter a valid quantity",
    };
    const t = (key: string) => translations[key] || key;
    return t;
  },
}));

// Mock sonner toast
const mockToastError = vi.fn();
const mockToastSuccess = vi.fn();
vi.mock("sonner", () => ({
  toast: {
    error: (...args: unknown[]) => mockToastError(...args),
    success: (...args: unknown[]) => mockToastSuccess(...args),
  },
}));

// Mock auth context
const mockUserAuth = { id: "user-123", username: "testuser" };
vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    user: mockUserAuth,
    isAuthenticated: true,
    isLoading: false,
  }),
}));

// Mock API
const mockOfferCreateRequest = vi.fn();
vi.mock("@/api/business_modules/livestocktrading", () => ({
  LivestockTradingAPI: {
    Offers: {
      Create: { Request: (...args: unknown[]) => mockOfferCreateRequest(...args) },
    },
  },
}));

import { MakeOfferDialog } from "@/components/features/make-offer-dialog";

// ─── Default Props ──────────────────────────────────────────────────

const defaultProps = {
  productId: "prod-1",
  sellerId: "seller-1",
  productTitle: "Angus Bull - Premium Quality",
  basePrice: 15000,
  currency: "TRY",
  maxQuantity: 10,
  isOpen: true,
  onClose: vi.fn(),
  onSuccess: vi.fn(),
};

// ─── Tests ──────────────────────────────────────────────────────────

describe("MakeOfferDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ─── Rendering ──────────────────────────────────────────

  describe("Rendering", () => {
    it("should render dialog when isOpen is true", () => {
      render(<MakeOfferDialog {...defaultProps} />);

      expect(screen.getByText("Make Offer")).toBeInTheDocument();
      expect(
        screen.getByText("Angus Bull - Premium Quality")
      ).toBeInTheDocument();
    });

    it("should not render when isOpen is false", () => {
      render(<MakeOfferDialog {...defaultProps} isOpen={false} />);

      expect(screen.queryByText("Make Offer")).not.toBeInTheDocument();
    });

    it("should display the listing price", () => {
      render(<MakeOfferDialog {...defaultProps} />);

      expect(screen.getByText(/Listing Price/)).toBeInTheDocument();
      // Price and currency are rendered together in a single span
      // toLocaleString() in jsdom may format as "15,000" or "15000"
      const priceElement = screen.getByText((content) =>
        content.includes("15") && content.includes("000") && content.includes("TRY")
      );
      expect(priceElement).toBeInTheDocument();
    });

    it("should display form fields", () => {
      render(<MakeOfferDialog {...defaultProps} />);

      expect(screen.getByLabelText(/Your Offer/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Quantity/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Message/)).toBeInTheDocument();
    });

    it("should pre-fill price with basePrice", () => {
      render(<MakeOfferDialog {...defaultProps} />);

      const priceInput = screen.getByLabelText(
        /Your Offer/
      ) as HTMLInputElement;
      expect(priceInput.value).toBe("15000");
    });

    it("should pre-fill quantity with 1", () => {
      render(<MakeOfferDialog {...defaultProps} />);

      const quantityInput = screen.getByLabelText(
        /Quantity/
      ) as HTMLInputElement;
      expect(quantityInput.value).toBe("1");
    });
  });

  // ─── Form Interaction ───────────────────────────────────

  describe("Form Interaction", () => {
    it("should update price on input change", async () => {
      const user = userEvent.setup();
      render(<MakeOfferDialog {...defaultProps} />);

      const priceInput = screen.getByLabelText(
        /Your Offer/
      ) as HTMLInputElement;
      await user.clear(priceInput);
      await user.type(priceInput, "12000");

      expect(priceInput.value).toBe("12000");
    });

    it("should update quantity on input change", async () => {
      const user = userEvent.setup();
      render(<MakeOfferDialog {...defaultProps} />);

      const quantityInput = screen.getByLabelText(
        /Quantity/
      ) as HTMLInputElement;
      await user.clear(quantityInput);
      await user.type(quantityInput, "3");

      expect(quantityInput.value).toBe("3");
    });

    it("should call onClose when cancel button is clicked", async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();
      render(<MakeOfferDialog {...defaultProps} onClose={onClose} />);

      const cancelButton = screen.getByText("Cancel");
      await user.click(cancelButton);

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("should call onClose when backdrop is clicked", async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();
      render(<MakeOfferDialog {...defaultProps} onClose={onClose} />);

      // The backdrop is the element with bg-black/50
      const backdrop = document.querySelector(".bg-black\\/50");
      if (backdrop) {
        await user.click(backdrop);
        expect(onClose).toHaveBeenCalledTimes(1);
      }
    });
  });

  // ─── Form Submission ────────────────────────────────────

  describe("Form Submission", () => {
    it("should submit offer successfully", async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();
      const onSuccess = vi.fn();
      mockOfferCreateRequest.mockResolvedValueOnce({});

      render(
        <MakeOfferDialog
          {...defaultProps}
          onClose={onClose}
          onSuccess={onSuccess}
        />
      );

      const submitButton = screen.getByText("Send Offer");
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOfferCreateRequest).toHaveBeenCalledWith(
          expect.objectContaining({
            productId: "prod-1",
            buyerUserId: "user-123",
            sellerUserId: "seller-1",
            offeredPrice: 15000,
            currency: "TRY",
            quantity: 1,
            status: 0,
          })
        );
      });

      expect(mockToastSuccess).toHaveBeenCalledWith("Offer sent successfully");
      expect(onClose).toHaveBeenCalled();
      expect(onSuccess).toHaveBeenCalled();
    });

    it("should show error toast when submission fails", async () => {
      const user = userEvent.setup();
      mockOfferCreateRequest.mockRejectedValueOnce(new Error("Server error"));

      render(<MakeOfferDialog {...defaultProps} />);

      const submitButton = screen.getByText("Send Offer");
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockToastError).toHaveBeenCalledWith("Failed to send offer");
      });
    });

    it("should disable submit button while submitting", async () => {
      const user = userEvent.setup();

      // Make the request hang to check disabled state
      mockOfferCreateRequest.mockReturnValueOnce(new Promise(() => {}));

      render(<MakeOfferDialog {...defaultProps} />);

      const submitButton = screen.getByText("Send Offer");
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText("Sending...")).toBeInTheDocument();
      });
    });
  });

  // ─── Validation ─────────────────────────────────────────

  describe("Validation", () => {
    it("should show error for invalid price (0)", async () => {
      const user = userEvent.setup();
      render(<MakeOfferDialog {...defaultProps} />);

      const priceInput = screen.getByLabelText(
        /Your Offer/
      ) as HTMLInputElement;
      await user.clear(priceInput);
      await user.type(priceInput, "0");

      // Use fireEvent.submit to bypass HTML5 constraint validation in jsdom
      const form = priceInput.closest("form")!;
      fireEvent.submit(form);

      await waitFor(() => {
        expect(mockToastError).toHaveBeenCalledWith(
          "Please enter a valid price"
        );
      });

      expect(mockOfferCreateRequest).not.toHaveBeenCalled();
    });

    it("should show error for invalid quantity (0)", async () => {
      const user = userEvent.setup();
      render(<MakeOfferDialog {...defaultProps} />);

      const quantityInput = screen.getByLabelText(
        /Quantity/
      ) as HTMLInputElement;
      await user.clear(quantityInput);
      await user.type(quantityInput, "0");

      // Use fireEvent.submit to bypass HTML5 constraint validation in jsdom
      const form = quantityInput.closest("form")!;
      fireEvent.submit(form);

      await waitFor(() => {
        expect(mockToastError).toHaveBeenCalledWith(
          "Please enter a valid quantity"
        );
      });

      expect(mockOfferCreateRequest).not.toHaveBeenCalled();
    });
  });
});
