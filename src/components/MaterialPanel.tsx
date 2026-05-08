import type { ChangeEvent } from 'react';
import type { PresentationMaterial } from '../types';
import { formatDateTime } from '../utils/time';

interface MaterialPanelProps {
  disabled: boolean;
  material: PresentationMaterial | null;
  onChange: (material: PresentationMaterial | null) => void;
}

const formatSize = (size: number) => {
  if (size < 1024 * 1024) return `${Math.max(1, Math.round(size / 1024))}KB`;
  return `${(size / 1024 / 1024).toFixed(1)}MB`;
};

const readFileAsDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });

export function MaterialPanel({ disabled, material, onChange }: MaterialPanelProps) {
  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    const dataUrl = await readFileAsDataUrl(file);
    onChange({
      id: crypto.randomUUID(),
      name: file.name,
      type: file.type || 'application/octet-stream',
      size: file.size,
      uploadedAt: new Date().toISOString(),
      dataUrl,
    });
  };

  return (
    <section className="material-panel">
      <div className="section-heading">
        <p className="eyebrow">Material</p>
        <h2>발표자료</h2>
      </div>

      <label className={`file-drop ${disabled ? 'disabled' : ''}`}>
        <input
          disabled={disabled}
          type="file"
          accept=".pdf,.ppt,.pptx,.key,.doc,.docx,.png,.jpg,.jpeg,.webp"
          onChange={handleFileChange}
        />
        <span>자료 업로드</span>
        <small>PDF, PPT, 이미지 파일</small>
      </label>

      {material ? (
        <article className="material-card">
          <div>
            <strong>{material.name}</strong>
            <small>
              {formatSize(material.size)} · {formatDateTime(material.uploadedAt)}
            </small>
          </div>
          <div className="material-actions">
            <a className="ghost text-button" href={material.dataUrl} target="_blank" rel="noreferrer">
              열기
            </a>
            <button className="ghost text-button" type="button" onClick={() => onChange(null)}>
              삭제
            </button>
          </div>
        </article>
      ) : (
        <p className="empty-copy">선택한 발표에 연결된 자료가 없습니다.</p>
      )}
    </section>
  );
}
