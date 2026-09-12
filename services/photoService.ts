import * as FileSystem from 'expo-file-system/legacy';
import * as ImagePicker from 'expo-image-picker';

const PHOTOS_DIR = `${FileSystem.documentDirectory ?? ''}photos/`;

async function ensurePhotosDir(): Promise<void> {
  const info = await FileSystem.getInfoAsync(PHOTOS_DIR);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(PHOTOS_DIR, { intermediates: true });
  }
}

export async function requestCameraPermission(): Promise<boolean> {
  const { status } = await ImagePicker.requestCameraPermissionsAsync();
  return status === 'granted';
}

export async function requestGalleryPermission(): Promise<boolean> {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  return status === 'granted';
}

export async function pickImageFromGallery(): Promise<string | null> {
  const granted = await requestGalleryPermission();
  if (!granted) return null;

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [4, 3],
    quality: 0.8,
  });

  if (result.canceled || !result.assets[0]) return null;
  return savePhoto(result.assets[0].uri);
}

export async function takePhoto(): Promise<string | null> {
  const granted = await requestCameraPermission();
  if (!granted) return null;

  const result = await ImagePicker.launchCameraAsync({
    allowsEditing: true,
    aspect: [4, 3],
    quality: 0.8,
  });

  if (result.canceled || !result.assets[0]) return null;
  return savePhoto(result.assets[0].uri);
}

async function savePhoto(sourceUri: string): Promise<string> {
  await ensurePhotosDir();
  const filename = `exercise_${Date.now()}.jpg`;
  const destUri = `${PHOTOS_DIR}${filename}`;
  await FileSystem.copyAsync({ from: sourceUri, to: destUri });
  return destUri;
}

export async function deletePhoto(photoUri: string | null): Promise<void> {
  if (!photoUri) return;
  const info = await FileSystem.getInfoAsync(photoUri);
  if (info.exists) {
    await FileSystem.deleteAsync(photoUri, { idempotent: true });
  }
}

export function getPhotosDirectory(): string {
  return PHOTOS_DIR;
}

export async function photoToBase64(uri: string): Promise<string> {
  return FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
}

export async function base64ToPhoto(base64: string, filename: string): Promise<string> {
  await ensurePhotosDir();
  const destUri = `${PHOTOS_DIR}${filename}`;
  await FileSystem.writeAsStringAsync(destUri, base64, {
    encoding: FileSystem.EncodingType.Base64,
  });
  return destUri;
}
