const getFileNameFromUri = (uri: string) => {
  const lastSlash = uri.lastIndexOf('/')
  return lastSlash !== -1 ? uri.substring(lastSlash + 1) : `upload-${Date.now()}`;
};

const getMimeType = (uri: string): string => {
  const lower = uri.toLowerCase();
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.pdf')) return 'application/pdf';
  return 'application/octet-stream';
};

export const buildBusinessCardFormData = async (fileUri: string): Promise<FormData> => {
  const formData = new FormData();
  const name = getFileNameFromUri(fileUri);
  const type = getMimeType(fileUri);

  let uri = fileUri;
  if (uri.startsWith('file://') || uri.startsWith('content://')) {
  } else if (!(uri.startsWith('http://') || uri.startsWith('https://'))) {
    uri = `file://${uri}`;
  }

  const file: any = { uri, name, type };
  (formData as any).append('file', file);

  return formData;
};
