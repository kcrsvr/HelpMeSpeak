import * as FileSystem from "expo-file-system/legacy";
import * as VideoThumbnails from "expo-video-thumbnails";
import {
  persistPhoto,
  persistVideo,
  persistAudio,
  generateVideoPoster,
  deleteMedia,
} from "../media";

const thumbs = VideoThumbnails as unknown as { getThumbnailAsync: jest.Mock };

const fs = FileSystem as unknown as {
  getInfoAsync: jest.Mock;
  makeDirectoryAsync: jest.Mock;
  copyAsync: jest.Mock;
  deleteAsync: jest.Mock;
  documentDirectory: string;
};

const MEDIA_DIR = "file:///documents/media/";

describe("media persistence", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    fs.getInfoAsync.mockResolvedValue({ exists: true });
  });

  describe("persistPhoto", () => {
    it("copies the temp photo into the media dir and returns the destination", async () => {
      const dest = await persistPhoto("file:///tmp/pic.png");
      expect(fs.copyAsync).toHaveBeenCalledTimes(1);
      const arg = fs.copyAsync.mock.calls[0][0];
      expect(arg.from).toBe("file:///tmp/pic.png");
      expect(arg.to).toBe(dest);
      expect(dest.startsWith(`${MEDIA_DIR}photo_`)).toBe(true);
      expect(dest.endsWith(".png")).toBe(true);
    });

    it("defaults to a .jpg extension when the source has none", async () => {
      const dest = await persistPhoto("file:///tmp/noext");
      expect(dest.endsWith(".jpg")).toBe(true);
    });

    it("strips a query string before deducing the extension", async () => {
      const dest = await persistPhoto("file:///tmp/pic.jpeg?token=abc");
      expect(dest.endsWith(".jpeg")).toBe(true);
    });

    it("creates the media directory when it does not exist", async () => {
      fs.getInfoAsync.mockResolvedValue({ exists: false });
      await persistPhoto("file:///tmp/pic.png");
      expect(fs.makeDirectoryAsync).toHaveBeenCalledWith(
        MEDIA_DIR,
        expect.objectContaining({ intermediates: true })
      );
    });

    it("does not recreate the directory when it already exists", async () => {
      fs.getInfoAsync.mockResolvedValue({ exists: true });
      await persistPhoto("file:///tmp/pic.png");
      expect(fs.makeDirectoryAsync).not.toHaveBeenCalled();
    });
  });

  describe("persistVideo", () => {
    it("copies the temp video into the media dir and returns a video_ path", async () => {
      const dest = await persistVideo("file:///tmp/clip.mp4");
      expect(fs.copyAsync).toHaveBeenCalledTimes(1);
      const arg = fs.copyAsync.mock.calls[0][0];
      expect(arg.from).toBe("file:///tmp/clip.mp4");
      expect(arg.to).toBe(dest);
      expect(dest.startsWith(`${MEDIA_DIR}video_`)).toBe(true);
      expect(dest.endsWith(".mp4")).toBe(true);
    });

    it("defaults to a .mp4 extension when the source has none", async () => {
      const dest = await persistVideo("file:///tmp/noext");
      expect(dest.endsWith(".mp4")).toBe(true);
    });

    it("preserves a .mov extension from the source", async () => {
      const dest = await persistVideo("file:///tmp/clip.mov");
      expect(dest.endsWith(".mov")).toBe(true);
    });
  });

  describe("generateVideoPoster", () => {
    it("extracts an early frame and persists it as a photo", async () => {
      thumbs.getThumbnailAsync.mockResolvedValueOnce({
        uri: "file:///tmp/thumb.jpg",
        width: 720,
        height: 720,
      });
      const poster = await generateVideoPoster(`${MEDIA_DIR}video_abc.mp4`);
      // grabs an early frame (skips a leading black frame)
      const [, opts] = thumbs.getThumbnailAsync.mock.calls[0];
      expect(opts.time).toBeGreaterThan(0);
      // the extracted frame is copied into permanent storage as a photo
      expect(fs.copyAsync).toHaveBeenCalledWith(
        expect.objectContaining({ from: "file:///tmp/thumb.jpg" })
      );
      expect(poster).not.toBeNull();
      expect(poster!.startsWith(`${MEDIA_DIR}photo_`)).toBe(true);
      expect(poster!.endsWith(".jpg")).toBe(true);
    });

    it("returns null (best-effort) when thumbnail generation fails", async () => {
      thumbs.getThumbnailAsync.mockRejectedValueOnce(new Error("no frame"));
      const poster = await generateVideoPoster(`${MEDIA_DIR}video_x.mp4`);
      expect(poster).toBeNull();
      expect(fs.copyAsync).not.toHaveBeenCalled();
    });
  });

  describe("persistAudio", () => {
    it("copies the recording and returns an audio_ path", async () => {
      const dest = await persistAudio("file:///tmp/rec.m4a");
      expect(fs.copyAsync).toHaveBeenCalledTimes(1);
      expect(dest.startsWith(`${MEDIA_DIR}audio_`)).toBe(true);
      expect(dest.endsWith(".m4a")).toBe(true);
    });

    it("defaults to .m4a when the source has no extension", async () => {
      const dest = await persistAudio("file:///tmp/recording");
      expect(dest.endsWith(".m4a")).toBe(true);
    });
  });

  describe("deleteMedia", () => {
    it("deletes a file that lives under the media dir", async () => {
      await deleteMedia(`${MEDIA_DIR}photo_abc.jpg`);
      expect(fs.deleteAsync).toHaveBeenCalledWith(
        `${MEDIA_DIR}photo_abc.jpg`,
        expect.objectContaining({ idempotent: true })
      );
    });

    it("ignores null / undefined uris", async () => {
      await deleteMedia(null);
      await deleteMedia(undefined);
      expect(fs.deleteAsync).not.toHaveBeenCalled();
    });

    it("ignores uris outside the media dir (e.g. bundled assets)", async () => {
      await deleteMedia("file:///tmp/somewhere/else.jpg");
      expect(fs.deleteAsync).not.toHaveBeenCalled();
    });

    it("swallows delete errors (best-effort)", async () => {
      fs.deleteAsync.mockRejectedValueOnce(new Error("gone"));
      await expect(deleteMedia(`${MEDIA_DIR}photo_x.jpg`)).resolves.toBeUndefined();
    });
  });
});
