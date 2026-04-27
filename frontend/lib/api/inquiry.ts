import { CreateInquiryRequest, InquiryResponse } from "@/types/inquiry";
import { API_URL, authHeaders, unwrap } from ".";

export const createInquiry = async (
  token: string,
  req: CreateInquiryRequest,
) => {
  const res = await fetch(`${API_URL}/inquiries`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({
      category: req.category,
      body: req.body,
      reply_requested: req.replyRequested,
      reply_to: req.replyTo,
    }),
  });
  return unwrap<InquiryResponse>(res);
};
