export type VideoAttachment = {
  type: 'file' | 'youtube';
  url: string; // UploadThing URL or YouTube URL
  fileName?: string;
  thumbnailUrl?: string;
};
