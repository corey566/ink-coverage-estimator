import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function formatPercentage(value: number): string {
  return `${value.toFixed(1)}%`;
}

export function getFileIcon(mimeType: string): string {
  switch (mimeType) {
    case 'application/pdf':
      return 'file-pdf';
    case 'application/postscript':
      return 'file-image';
    case 'application/vnd.ms-excel':
    case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
      return 'file-excel';
    case 'application/msword':
    case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
      return 'file-word';
    case 'image/jpeg':
    case 'image/png':
    case 'image/tiff':
    case 'image/gif':
      return 'image';
    default:
      return 'file';
  }
}
