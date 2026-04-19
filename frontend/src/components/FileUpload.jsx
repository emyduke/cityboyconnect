import { useState, useRef } from 'react';
import { cn } from '../lib/cn';

export default function FileUpload({ accept = 'image/*', compress = true, preview = true, onChange, error, label }) {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const inputRef = useRef();

  const compressImage = (file, maxWidth = 1200, quality = 0.7) =>
    new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ratio = Math.min(maxWidth / img.width, 1);
          canvas.width = img.width * ratio;
          canvas.height = img.height * ratio;
          canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
          canvas.toBlob((blob) => resolve(new File([blob], file.name, { type: 'image/jpeg' })), 'image/jpeg', quality);
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });

  const handleFile = async (e) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    setUploading(true);
    setProgress(30);
    let processed = selected;
    if (compress && selected.type.startsWith('image/')) {
      processed = await compressImage(selected);
      setProgress(70);
    }
    if (preview && processed.type.startsWith('image/')) {
      setPreviewUrl(URL.createObjectURL(processed));
    }
    setFile(processed);
    setProgress(100);
    setUploading(false);
    onChange?.(processed);
  };

  const handleRemove = () => {
    setFile(null);
    setPreviewUrl(null);
    setProgress(0);
    if (inputRef.current) inputRef.current.value = '';
    onChange?.(null);
  };

  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-sm font-semibold text-gray-700">{label}</label>}
      {!file ? (
        <div
          className={cn(
            'flex flex-col items-center justify-center gap-2 p-8 border-2 border-dashed rounded-xl cursor-pointer transition-colors hover:border-forest hover:bg-forest/5',
            error ? 'border-danger' : 'border-gray-300',
          )}
          onClick={() => inputRef.current?.click()}
        >
          <span className="text-3xl">📷</span>
          <span className="text-sm font-medium text-gray-700">Click to upload</span>
          <span className="text-xs text-gray-400">JPG, PNG up to 5MB</span>
        </div>
      ) : (
        <div className="relative inline-block">
          {previewUrl && <img src={previewUrl} alt="Preview" className="w-full max-h-48 object-cover rounded-xl" />}
          {!previewUrl && <span className="text-sm text-gray-600">{file.name}</span>}
          <button
            type="button"
            className="absolute top-2 right-2 w-7 h-7 bg-danger text-white rounded-full flex items-center justify-center text-xs font-bold cursor-pointer hover:opacity-80"
            onClick={handleRemove}
          >
            ✕
          </button>
        </div>
      )}
      {uploading && (
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full bg-forest rounded-full transition-all" style={{ width: `${progress}%` }} />
        </div>
      )}
      <input ref={inputRef} type="file" accept={accept} onChange={handleFile} className="sr-only" />
      {error && <span className="text-[0.8125rem] text-danger">{error}</span>}
    </div>
  );
}
