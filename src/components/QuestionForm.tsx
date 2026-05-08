import { FormEvent, useState } from 'react';

interface QuestionFormProps {
  disabled: boolean;
  onAdd: (nickname: string, content: string) => void;
}

export function QuestionForm({ disabled, onAdd }: QuestionFormProps) {
  const [nickname, setNickname] = useState('');
  const [content, setContent] = useState('');

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    onAdd(nickname, content);
    setContent('');
  };

  return (
    <form className="question-form" onSubmit={handleSubmit}>
      <div className="section-heading">
        <p className="eyebrow">Audience</p>
        <h2>질문 등록</h2>
      </div>
      <label>
        닉네임
        <input
          disabled={disabled}
          placeholder="질문자 이름"
          value={nickname}
          onChange={(event) => setNickname(event.target.value)}
        />
      </label>
      <label>
        질문
        <textarea
          disabled={disabled}
          placeholder="발표자에게 묻고 싶은 내용을 입력하세요"
          value={content}
          onChange={(event) => setContent(event.target.value)}
        />
      </label>
      <button className="primary text-button" type="submit" disabled={disabled || !nickname.trim() || !content.trim()}>
        질문 추가
      </button>
    </form>
  );
}
