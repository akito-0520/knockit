type InquiryCategory = "bug" | "feature" | "other";

type CreateInquiryRequest = {
  category: InquiryCategory;
  body: string;
  replyRequested: boolean;
  replyTo: string | null;
};

type InquiryResponse = {
  id: string;
  createdAt: string;
};

export type { InquiryCategory, CreateInquiryRequest, InquiryResponse };
