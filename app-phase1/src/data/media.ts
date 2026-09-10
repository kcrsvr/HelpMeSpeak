// ============================================================
// Media storage — copies picked photos and recorded audio into the
// app's persistent document directory (device filesystem, as per the
// Phase 1 storage plan). Returns a stable file:// URI to store in SQLite.
// ============================================================

import * as FileSystem from "expo-file-system";
import { newId } from "../utils/id";

const MEDIA_DIR = `${FileSystem.documentDirectory}media/`;

async function ensureDir(): Promise<void> {
  const info = await FileSystem.getInfoAsync(MEDIA_DIR);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(MEDIA_DIR, { intermediates: true });
  }
}

function extFrom(uri: string, fallback: string): string {
  const match = uri.split("?")[0].match(/\.([a-zA-Z0-9]+)$/);
  return match ? match[1] : fallback;
}

/** Copy a transient photo (from image picker cache) into permanent storage. */
export async function persistPhoto(tempUri: string): Promise<string> {
  await ensureDir();
  const dest = `${MEDIA_DIR}${newId("photo")}.${extFrom(tempUri, "jpg")}`;
  await FileSystem.copyAsync({ from: tempUri, to: dest });
  return dest;
}

/** Copy a recorded audio clip into permanent storage. */
export async function persistAudio(tempUri: string): Promise<string> {
  await ensureDir();
  const dest = `${MEDIA_DIR}${newId("audio")}.${extFrom(tempUri, "m4a")}`;
  await FileSystem.copyAsync({ from: tempUri, to: dest });
  return dest;
}

/** Best-effort delete of a stored media file. */
export async function deleteMedia(uri: string | null | undefined): Promise<void> {
  if (!uri || !uri.startsWith(MEDIA_DIR)) return;
  try {
    await FileSystem.deleteAsync(uri, { idempotent: true });
  } catch {
    // non-fatal
  }
}
