'use client';

import { useState } from 'react';
import TimerDisplay from './TimerDisplay';
import { GAME_CONFIG } from '@/lib/game/config';

interface Question {
  id: number;
  text: string;
  answers: string[];
  difficulty: string;
  category: string;
}

interface Props {
  question: Question;
  timeRemainingMs: number;
  hasAnswered: boolean;
  selectedAnswerIndex: number | null;
  answeredCount: number;
  totalPlayers: number;
  onSubmitAnswer: (index: number) => void;
}

const difficultyColors: Record<string, string> = {
  easy: 'bg-green-500/20 text-green-400 border-green-500/50',
  medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50',
  hard: 'bg-red-500/20 text-red-400 border-red-500/50',
};

const answerLabels = ['A', 'B', 'C', 'D'];

export default function QuestionPhase({
  question,
  timeRemainingMs,
  hasAnswered,
  selectedAnswerIndex,
  answeredCount,
  totalPlayers,
  onSubmitAnswer,
}: Props) {
  const [submitting, setSubmitting] = useState(false);

  const handleAnswer = async (index: number) => {
    if (hasAnswered || submitting) return;
    setSubmitting(true);
    onSubmitAnswer(index);
  };

  return (
    <div>
      <TimerDisplay
        serverTimeRemainingMs={timeRemainingMs}
        totalSeconds={GAME_CONFIG.QUESTION_TIME_LIMIT_SECONDS}
      />

      {/* Question card */}
      <div className="p-6 bg-gray-800/70 border-2 border-purple-500/30 rounded-lg mb-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-5 h-5 border-t-2 border-l-2 border-cyan-500" />
        <div className="absolute bottom-0 right-0 w-5 h-5 border-b-2 border-r-2 border-cyan-500" />

        <div className="flex gap-2 mb-3">
          <span className="text-xs px-2 py-0.5 rounded border bg-blue-500/20 text-blue-400 border-blue-500/50">
            {question.category}
          </span>
          <span
            className={`text-xs px-2 py-0.5 rounded border ${difficultyColors[question.difficulty] || ''}`}
          >
            {question.difficulty}
          </span>
        </div>

        <p className="text-lg text-white leading-relaxed">{question.text}</p>
      </div>

      {/* Answers */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
        {question.answers.map((answer, index) => {
          const isSelected = selectedAnswerIndex === index;
          let btnClass =
            'w-full p-4 text-left rounded-lg border transition-all cursor-pointer ';

          if (hasAnswered) {
            if (isSelected) {
              btnClass +=
                'bg-cyan-500/20 border-cyan-500 text-white shadow-[0_0_15px_rgba(0,255,255,0.2)]';
            } else {
              btnClass +=
                'bg-gray-800/50 border-gray-700 text-gray-500 cursor-not-allowed';
            }
          } else {
            btnClass +=
              'bg-gray-800/50 border-gray-700 text-white hover:border-cyan-500 hover:bg-cyan-500/10 hover:shadow-[0_0_15px_rgba(0,255,255,0.1)]';
          }

          return (
            <button
              key={index}
              onClick={() => handleAnswer(index)}
              disabled={hasAnswered || submitting}
              className={btnClass}
            >
              <span className="text-cyan-400 font-mono mr-3">
                {answerLabels[index]}.
              </span>
              {answer}
            </button>
          );
        })}
      </div>

      {/* Status */}
      <div className="text-center text-sm text-gray-500">
        {hasAnswered ? (
          <span className="text-cyan-400">
            Answer submitted. Waiting for others...
          </span>
        ) : (
          <span>Select your answer</span>
        )}
        <span className="ml-3">
          {answeredCount}/{totalPlayers} answered
        </span>
      </div>
    </div>
  );
}
