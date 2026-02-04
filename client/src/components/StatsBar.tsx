import type { TodoStats } from '../types';

interface StatsBarProps {
  stats: TodoStats;
}

export default function StatsBar({ stats }: StatsBarProps) {
  const percentage = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;
  // SVG circle math: radius=18, circumference=2*pi*18≈113.1
  const radius = 18;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="stats-bar" aria-label="Todo statistics">
      <div className="stats-bar-ring">
        <svg width="48" height="48" viewBox="0 0 48 48">
          <circle
            className="stats-ring-bg"
            cx="24"
            cy="24"
            r={radius}
            fill="none"
            strokeWidth="4"
          />
          <circle
            className="stats-ring-fill"
            cx="24"
            cy="24"
            r={radius}
            fill="none"
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            transform="rotate(-90 24 24)"
          />
        </svg>
        <span className="stats-ring-text">{percentage}%</span>
      </div>
      <span className="stats-bar-text">
        {stats.completed} of {stats.total} completed
        {stats.overdue > 0 && <> &middot; <span className="stats-overdue">{stats.overdue} overdue</span></>}
      </span>
    </div>
  );
}
