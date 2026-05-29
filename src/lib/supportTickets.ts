import { isSupabaseConfigured, supabase } from "./supabaseClient";
import { logger } from "./logger";
import type { SupportTicketInsert } from "../types/database";

export interface SubmitSupportTicketInput {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export type SubmitSupportTicketResult =
  | { ok: true }
  | { ok: false; error: string };

export async function submitSupportTicket(
  input: SubmitSupportTicketInput,
): Promise<SubmitSupportTicketResult> {
  if (!isSupabaseConfigured() || !supabase) {
    return { ok: false, error: "Support is unavailable right now. Please try again later." };
  }

  const name = input.name.trim();
  const email = input.email.trim();
  const subject = input.subject.trim();
  const message = input.message.trim();

  if (!name || !email || !subject || !message) {
    return { ok: false, error: "Please fill in all fields." };
  }

  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError || !sessionData.session?.user?.id) {
    return { ok: false, error: "Sign in to contact support." };
  }

  const userId = sessionData.session.user.id;

  const payload: SupportTicketInsert = {
    user_id: userId,
    name,
    email,
    subject,
    message,
  };

  const { error } = await supabase.from("support_tickets").insert(payload as never);

  if (error) {
    logger.warn("[support_tickets] insert failed:", error.message);
    return { ok: false, error: "Unable to send your message. Please try again." };
  }

  return { ok: true };
}
