import { useMutation } from "@tanstack/react-query";
import { imagesService, type UploadedImage } from "./images.service";

export const useUploadImageMutation = () =>
  useMutation<UploadedImage, Error, File>({
    mutationFn: (file: File) => imagesService.upload(file),
  });
