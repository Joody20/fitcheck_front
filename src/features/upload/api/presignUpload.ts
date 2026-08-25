
export type UploadCategory = "PROFILE" | "POST" | "VOTE";

export type PresignFile = {
  uploadUrl: string;
  imageObjectKey: string;
};

export async function requestUploadPresign(
  category: UploadCategory,
  extensions: string[],
) {
  void category;
  return extensions.map((_, index) => ({
    uploadUrl: "local://preview",
    imageObjectKey: `/images/${["post_ex.webp", "vote_1.jpeg", "vote_2.jpeg"][index % 3]}`,
  }));
}

export async function uploadToPresignedUrl(
  uploadUrl: string,
  file: Blob,
  contentType?: string,
) {
  // Image files remain local previews in the frontend-only build.
  void uploadUrl;
  void file;
  void contentType;
}
