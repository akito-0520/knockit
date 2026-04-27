type InquiryCategory = "bug" | "feature" | "other";

type CreateInquiryRequest = {
  category: InquiryCategory;
  body: string;
  replyRequested: boolean;
  replyTo: string | null;
};

type InquiryResponse = {
  category: InquiryCategory;
  body: string;
  replyRequested: boolean;
  replyTo: string | null;
  createdAt: string;
};

export type { InquiryCategory, CreateInquiryRequest, InquiryResponse };
