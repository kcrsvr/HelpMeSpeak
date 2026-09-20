// ============================================================
// Media storage — copies picked photos and recorded audio into the
// app's persistent document directory (device filesystem, as per the
// Phase 1 storage plan). Returns a stable file:// URI to store in SQLite.
// ============================================================

// SDK 57 introduced a new File/Directory API; the classic function-based API
// (documentDirectory, copyAsync, etc.) lives under the /legacy entry point and
// is fully supported. We use it here to keep media handling simple and stable.
import * as FileSystem from "expo-file-system/legacy";
import * as VideoThumbnails from "expo-video-thumbnails";
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

/** Copy a transient video (from image picker cache) into permanent storage. */
export async function persistVideo(tempUri: string): Promise<string> {
  await ensureDir();
  const dest = `${MEDIA_DIR}${newId("video")}.${extFrom(tempUri, "mp4")}`;
  await FileSystem.copyAsync({ from: tempUri, to: dest });
  return dest;
}

/**
 * Extract a still frame from a video and persist it as a photo, to use as the
 * word's poster/thumbnail (shown in grids and when animation is disabled).
 * Grabs an early frame (~120ms in) to skip any black leading frame. Best-effort:
 * returns null if thumbnail generation isn't available or fails, so a missing
 * poster never blocks saving the video.
 */
export async function generateVideoPoster(videoUri: string): Promise<string | null> {
  try {
    const { uri } = await VideoThumbnails.getThumbnailAsync(videoUri, {
      time: 120,
      quality: 0.7,
    });
    return await persistPhoto(uri);
  } catch {
    return null;
  }
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
