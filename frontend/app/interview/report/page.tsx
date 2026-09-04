import Link from 'next/link';

const QUESTION_SCORES = [
  { label: '질문 1', value: 78 },
  { label: '질문 2', value: 84 },
  { label: '질문 3', value: 71 },
  { label: '질문 4', value: 88 },
  { label: '질문 5', value: 90 },
];

const FEEDBACK = [
  { q: '질문 1', note: '초반 시선 이탈이 2회 감지됐어요. 답변 시작 전 카메라를 먼저 응시해보세요.' },
  { q: '질문 3', note: '답변 중 긴장 표정이 가장 오래 지속됐어요. 호흡을 고르고 천천히 답해보세요.' },
  { q: '질문 5', note: '시선 유지율과 표정 안정도 모두 가장 높았어요. 이 리듬을 기억해두세요.' },
];

export default function ReportPage() {
  return (
    <div className="page-shell">
      <Link className="page-back" href="/">← 홈으로</Link>
      <h1 className="page-title">행동 리포트</h1>
      <p className="page-sub">방금 진행한 모의면접의 시선·표정 분석 결과입니다.</p>

      <div className="report-stat-grid">
        <div className="report-stat"><div className="k">시선 유지율</div><div className="v num">82%</div></div>
        <div className="report-stat"><div className="k">안정 표정 비율</div><div className="v num">74%</div></div>
        <div className="report-stat"><div className="k">알림 횟수</div><div className="v num">6회</div></div>
      </div>

      <div className="question-card">
        <div className="question-index">질문별 시선 유지율</div>
        {QUESTION_SCORES.map((s) => (
          <div className="bar-row" key={s.label}>
            <span className="bar-label">{s.label}</span>
            <div className="bar-track"><div className="bar-fill" style={{ width: `${s.value}%` }} /></div>
            <span className="bar-value num">{s.value}%</span>
          </div>
        ))}
      </div>

      <div className="question-card">
        <div className="question-index">피드백</div>
        <ul className="feedback-list">
          {FEEDBACK.map((f) => (
            <li key={f.q}><b>{f.q}</b>{f.note}</li>
          ))}
        </ul>
      </div>

      <div className="action-row">
        <Link className="btn-ghost" href="/upload">영상으로 다시 분석</Link>
        <Link className="btn-solid" href="/interview">다시 도전하기 →</Link>
      </div>
    </div>
  );
}