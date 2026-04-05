import './FileUpload.css';
import { useState, useRef } from 'react';

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
    <div className={`file-upload ${error ? 'file-upload--error' : ''}`}>
      {label && <label className="file-upload__label">{label}</label>}
      {!file ? (
        <div className="file-upload__dropzone" onClick={() => inputRef.current?.click()}>
          <span className="file-upload__icon">📷</span>
          <span className="file-upload__text">Click to upload</span>
          <span className="file-upload__hint">JPG, PNG up to 5MB</span>
        </div>
      ) : (
        <div className="file-upload__preview-wrap">
          {previewUrl && <img src={previewUrl} alt="Preview" className="file-upload__preview" />}
          {!previewUrl && <span className="file-upload__filename">{file.name}</span>}
          <button type="button" className="file-upload__remove" onClick={handleRemove}>✕</button>
        </div>
      )}
      {uploading && (
        <div className="file-upload__progress">
          <div className="file-upload__progress-bar" style={{ width: `${progress}%` }} />
        </div>
      )}
      <input ref={inputRef} type="file" accept={accept} onChange={handleFile} className="sr-only" />
      {error && <span className="file-upload__error">{error}</span>}
    </div>
  );
}
