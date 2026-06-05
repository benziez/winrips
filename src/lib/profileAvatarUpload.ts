import { Camera, CameraResultType, CameraSource } from "@capacitor/camera";
import { Capacitor } from "@capacitor/core";
import { isSupabaseConfigured, supabase } from "./supabaseClient";

const AVATAR_BUCKET = "avatars";
const MAX_BYTES = 5 * 1024 * 1024;
const UPLOAD_TIMEOUT_MS = 30_000;

export interface ProfileAvatarUploadResult {
  url: string | null;
  error: string | null;
}

interface UploadPayload {
  bytes: Uint8Array;
  mime: string;
}

function withTimeout<T>(promise: Promise<T>, ms: number, timeoutMessage: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = window.setTimeout(() => {
      reject(new Error(timeoutMessage));
    }, ms);

    promise
      .then((value) => {
        window.clearTimeout(timer);
        resolve(value);
      })
      .catch((error: unknown) => {
        window.clearTimeout(timer);
        reject(error);
      });
  });
}

function isUserCancelledError(message: string): boolean {
  const normalized = message.toLowerCase();
  return (
    normalized.includes("cancel") ||
    normalized.includes("user denied") ||
    normalized.includes("dismiss")
  );
}

/** Convert a Capacitor/browser data URL into bytes Supabase Storage accepts on iOS WebKit. */
async function dataUrlToUploadPayload(dataUrl: string): Promise<UploadPayload | null> {
  const trimmed = dataUrl.trim();
  if (!trimmed.startsWith("data:")) {
    return null;
  }

  // fetch(dataUrl) is the most reliable path in Capacitor WKWebView.
  try {
    const response = await fetch(trimmed);
    const blob = await response.blob();
    if (blob.size > 0) {
      const buffer = await blob.arrayBuffer();
      const mime = blob.type?.trim() || parseDataUrlMime(trimmed) || "image/jpeg";
      return { bytes: new Uint8Array(buffer), mime };
    }
  } catch {
    /* fall through to manual base64 decode */
  }

  const commaIndex = trimmed.indexOf(",");
  if (commaIndex < 0) {
    return null;
  }

  const mime = parseDataUrlMime(trimmed) || "image/jpeg";
  const base64 = trimmed.slice(commaIndex + 1).replace(/\s/g, "");

  try {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) {
      bytes[i] = binary.charCodeAt(i);
    }
    if (bytes.byteLength === 0) {
      return null;
    }
    return { bytes, mime };
  } catch {
    return null;
  }
}

function parseDataUrlMime(dataUrl: string): string | null {
  const match = /^data:([^;,]+)/i.exec(dataUrl.trim());
  const mime = match?.[1]?.trim();
  return mime || null;
}

async function pickAvatarDataUrl(): Promise<string | null> {
  if (Capacitor.isNativePlatform()) {
    try {
      const photo = await Camera.getPhoto({
        quality: 88,
        allowEditing: true,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Prompt,
        width: 512,
        height: 512,
      });
      return photo.dataUrl?.trim() || null;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Photo picker failed.";
      if (isUserCancelledError(message)) {
        return null;
      }
      throw error;
    }
  }

  return new Promise((resolve, reject) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/jpeg,image/png,image/webp";
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) {
        resolve(null);
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        resolve(typeof reader.result === "string" ? reader.result : null);
      };
      reader.onerror = () => {
        reject(new Error("Could not read the selected image."));
      };
      reader.readAsDataURL(file);
    };
    input.click();
  });
}

function extensionForMime(mime: string): string {
  if (mime.includes("png")) return "png";
  if (mime.includes("webp")) return "webp";
  return "jpg";
}

/** Pick a photo (camera or library) and upload to Supabase Storage avatars bucket. */
export async function pickAndUploadProfileAvatar(
  userId: string,
): Promise<ProfileAvatarUploadResult> {
  if (!isSupabaseConfigured() || !supabase) {
    return { url: null, error: "Profile photos require Supabase." };
  }

  const trimmedUserId = userId.trim();
  if (!trimmedUserId) {
    return { url: null, error: "Sign in to upload a profile photo." };
  }

  try {
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) {
      return { url: null, error: sessionError.message };
    }
    if (!sessionData.session) {
      return { url: null, error: "Please sign in again to upload a profile photo." };
    }

    const dataUrl = await pickAvatarDataUrl();
    if (!dataUrl) {
      return { url: null, error: null };
    }

    const payload = await dataUrlToUploadPayload(dataUrl);
    if (!payload) {
      return { url: null, error: "Could not read the selected image." };
    }

    if (payload.bytes.byteLength > MAX_BYTES) {
      return { url: null, error: "Image must be under 5 MB." };
    }

    const ext = extensionForMime(payload.mime);
    const objectPath = `${trimmedUserId}/avatar.${ext}`;

    const uploadResult = await withTimeout(
      supabase.storage.from(AVATAR_BUCKET).upload(objectPath, payload.bytes, {
        upsert: true,
        contentType: payload.mime,
        cacheControl: "3600",
      }),
      UPLOAD_TIMEOUT_MS,
      "Upload timed out. Check your connection and try again.",
    );

    if (uploadResult.error) {
      return {
        url: null,
        error: uploadResult.error.message || "Could not upload profile photo.",
      };
    }

    const { data: publicData } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(objectPath);
    const publicUrl = `${publicData.publicUrl}?v=${Date.now()}`;

    const profileResult = await withTimeout(
      Promise.resolve(
        supabase
          .from("profiles")
          .update({ avatar_url: publicUrl } as never)
          .eq("id", trimmedUserId),
      ),
      UPLOAD_TIMEOUT_MS,
      "Saving profile photo timed out. Please try again.",
    );

    if (profileResult.error) {
      return {
        url: null,
        error: profileResult.error.message || "Could not save profile photo.",
      };
    }

    return { url: publicUrl, error: null };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Profile photo upload failed.";
    if (isUserCancelledError(message)) {
      return { url: null, error: null };
    }
    return { url: null, error: message };
  }
}
