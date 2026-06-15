import apiClient from "../client/client";

export interface UploadedImage {
  id: string;
  url: string;
}

export const imagesService = {
  async upload(file: File): Promise<UploadedImage> {
    const formData = new FormData();
    formData.append("file", file);

    const response = await apiClient.post<UploadedImage>("/images", formData, {
      headers: { "Content-Type": undefined },
    });

    return response.data;
  },
};
