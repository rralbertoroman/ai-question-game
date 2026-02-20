'use client';

import TimerDisplay from './TimerDisplay';
import { GAME_CONFIG } from '@/lib/game/config';
import type { PlayerQuestionResult } from '@/lib/game/types';

interface Summary {
  questionText: string;
  answers: string[];
  correctIndex: number;
  playerResults: PlayerQuestionResult[];
}

interface Props {
  summary: Summary;
  timeRemainingMs: number;
}

const answerLabels = ['A', 'B', 'C', 'D'];

export default function SummaryPhase({ summary, timeRemainingMs }: Props) {
  return (
    <div className="animate-fade-in-up">
      <TimerDisplay
        serverTimeRemainingMs={timeRemainingMs}
        totalSeconds={GAME_CONFIG.SUMMARY_DISPLAY_SECONDS}
      />

      {/* Question with correct answer */}
      <div className="p-6 bg-gray-800/70 border-2 border-purple-500/30 rounded-lg mb-6">
        <p className="text-lg text-white mb-4">{summary.questionText}</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {summary.answers.map((answer, index) => {
            const isCorrect = index === summary.correctIndex;
            let cls = 'p-3 rounded-lg border text-sm ';

            if (isCorrect) {
              cls +=
                'bg-green-500/20 border-green-500 text-green-400 shadow-[0_0_15px_rgba(0,255,136,0.2)]';
            } else {
              cls += 'bg-gray-800/50 border-gray-700 text-gray-500';
            }

            return (
              <div key={index} className={cls}>
                <span className="font-mono mr-2">{answerLabels[index]}.</span>
                {answer}
                {isCorrect && <span className="ml-2">\u2713</span>}
              </div>
            );
          })}
        </div>
      </div>

      {/* Player results */}
      <div className="p-4 bg-gray-800/50 border border-gray-700 rounded-lg">
        <h3 className="text-sm text-purple-400 uppercase tracking-wider mb-3">
          Results
        </h3>
        <div className="space-y-2">
          {summary.playerResults.map((result, index) => {
            const isCorrect = result.isCorrect;
            const timedOut = result.answerIndex === null;

            return (
              <div
                key={result.userId}
                className="flex items-center justify-between text-sm animate-stagger-in"
                style={{ '--i': index } as React.CSSProperties}
              >
                <span className="text-gray-300">{result.username}</span>
                <span>
                  {timedOut ? (
                    <span className="text-gray-500 italic">Timed out</span>
                  ) : isCorrect ? (
                    <span className="text-green-400">
                      {answerLabels[result.answerIndex!]} \u2713
                    </span>
                  ) : (
                    <span className="text-red-400">
                      {answerLabels[result.answerIndex!]} \u2717
                    </span>
                  )}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
