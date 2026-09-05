'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ToastStack, { ToastItem } from '../components/ToastStack';

const QUESTIONS = [
  '1분간 자기소개를 해주세요.',
  '이 직무에 지원한 동기를 말씀해주세요.',
  '본인의 강점과 약점은 무엇인가요?',
  '협업 중 갈등을 해결했던 경험이 있나요?',
  '마지막으로 하고 싶은 말씀이 있다면 해주세요.',
];

const TOAST_POOL: { icon: string; message: string }[] = [
  { icon: '👁️', message: '시선이 화면 밖으로 벗어났어요' },
  { icon: '🙂', message: '표정에서 긴장이 감지됐어요' },
  { icon: '✅', message: '좋아요, 안정적인 시선이에요' },
  { icon: '😮', message: '당황한 표정이 감지됐어요' },
];

let toastId = 0;

export default function InterviewPage() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [cameraError, setCameraError] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    let stream: MediaStream | null = null;
    navigator.mediaDevices
      ?.getUserMedia({ video: true })
      .then((s) => {
        stream = s;
        if (videoRef.current) videoRef.current.srcObject = s;
      })
      .catch(() => setCameraError(true));
    return () => stream?.getTracks().forEach((t) => t.stop());
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const pick = TOAST_POOL[Math.floor(Math.random() * TOAST_POOL.length)];
      const id = ++toastId;
      setToasts((prev) => [...prev, { id, ...pick }]);
      setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const isLast = currentIndex === QUESTIONS.length - 1;
  const progress = ((currentIndex + 1) / QUESTIONS.length) * 100;

  const handleNext = () => {
    if (isLast) {
      router.push('/interview/report');
    } else {
      setCurrentIndex((i) => i + 1);
    }
  };

  return (
    <div className="page-shell">
      <ToastStack toasts={toasts} />
      <Link className="page-back" href="/">← 홈으로</Link>
      <h1 className="page-title">모의면접 진행 중</h1>
      <p className="page-sub">웹캠으로 시선과 표정을 실시간으로 관찰하고 있습니다.</p>

      <div className="progress-track">
        <div className="progress-fill" style={{ width: `${progress}%` }} />
      </div>

      <div className="video-panel">
        {cameraError ? (
          <div className="video-empty">웹캠 권한이 필요합니다. 브라우저 설정에서 카메라 접근을 허용해주세요.</div>
        ) : (
          <video ref={videoRef} autoPlay playsInline muted />
        )}
        <div className="video-rec"><span className="dot" />분석 중</div>
      </div>

      <div className="question-card">
        <div className="question-index">질문 {currentIndex + 1} / {QUESTIONS.length}</div>
        <p className="question-text">{QUESTIONS[currentIndex]}</p>
      </div>

      <div className="action-row">
        <button className="btn-solid" onClick={handleNext}>
          {isLast ? '결과 보기 →' : '다음 질문 →'}
        </button>
      </div>
    </div>
  );
}