/**
 * Video validation utilities for YouTube URLs and video files
 */

// YouTube URL patterns to support various formats
const YOUTUBE_PATTERNS = [
  /youtube\.com\/watch\?v=([a-zA-Z0-9_-]+)/,
  /youtu\.be\/([a-zA-Z0-9_-]+)/,
  /youtube\.com\/embed\/([a-zA-Z0-9_-]+)/,
  /youtube\.com\/v\/([a-zA-Z0-9_-]+)/,
];

/**
 * Validates if a URL is a valid YouTube URL
 * @param url - The URL to validate
 * @returns true if the URL matches a known YouTube format
 */
export function isValidYouTubeUrl(url: string): boolean {
  return YOUTUBE_PATTERNS.some((pattern) => pattern.test(url));
}

/**
 * Extracts the YouTube video ID from a URL
 * @param url - The YouTube URL
 * @returns The video ID if found, null otherwise
 */
export function extractYouTubeVideoId(url: string): string | null {
  for (const pattern of YOUTUBE_PATTERNS) {
    const match = url.match(pattern);
    if (match) {
      return match[1];
    }
  }
  return null;
}

/**
 * Validates a video file for size and type
 * @param file - The File object to validate
 * @returns Object with valid boolean and optional error message
 */
export function validateVideoFile(
  file: File
): { valid: boolean; error?: string } {
  const MAX_SIZE = 100 * 1024 * 1024; // 100MB
  const ALLOWED_TYPES = ["video/mp4", "video/webm", "video/quicktime"];

  if (file.size > MAX_SIZE) {
    return { valid: false, error: "Video must be less than 100MB" };
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: "Only MP4, WebM, and MOV files are supported",
    };
  }

  return { valid: true };
}
