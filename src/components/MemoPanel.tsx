interface MemoPanelProps {
  memo: string;
  disabled: boolean;
  onChange: (memo: string) => void;
}

export function MemoPanel({ memo, disabled, onChange }: MemoPanelProps) {
  return (
    <section className="memo-panel">
      <div className="section-heading">
        <p className="eyebrow">Evaluation</p>
        <h2>평가 메모</h2>
      </div>
      <textarea
        disabled={disabled}
        aria-label="평가 메모"
        placeholder="발표 전달력 좋음&#10;데모가 인상적&#10;성능 수치 보완 필요"
        value={memo}
        onChange={(event) => onChange(event.target.value)}
      />
    </section>
  );
}
