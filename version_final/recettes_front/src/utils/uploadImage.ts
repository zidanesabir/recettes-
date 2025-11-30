import { storage } from "@/firebaseConfig";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

export const uploadImage = async (file: File, folder: string) => {
  if (!file) return null;

  const fileRef = ref(storage, `${folder}/${Date.now()}_${file.name}`);

  // Upload
  const snapshot = await uploadBytes(fileRef, file);

  // Get URL
  const url = await getDownloadURL(snapshot.ref);

  return url;
};
