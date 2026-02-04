const API_URL = import.meta.env.VITE_API_URL || '';

export async function convertWithSignatory(file, signatoryName) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('signatoryName', signatoryName);

  const response = await fetch(`${API_URL}/api/inject-signatory`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Conversion failed' }));
    throw new Error(error.error || 'Conversion failed');
  }

  return response.blob();
}
