const STATS = [
  { key: 'total',       label: 'Total Tasks',  icon: '📌', color: 'purple' },
  { key: 'todo',        label: 'To do',        icon: '🔵', color: 'blue'   },
  { key: 'in_progress', label: 'In Progress',  icon: '⚡', color: 'yellow' },
  { key: 'done',        label: 'Completed',    icon: '✅', color: 'green'  },
  { key: 'overdue',     label: 'Overdue',      icon: '🔥', color: 'red'    },
];

const StatsCard = ({ stats }) => (
  <div className="stats-grid">
    {STATS.map(({ key, label, icon, color }) => (
      <div key={key} className={`stat-card ${color}`}>
        <span className="stat-icon">{icon}</span>
        <div className="stat-value">{stats?.[key] ?? 0}</div>
        <div className="stat-label">{label}</div>
      </div>
    ))}
  </div>
);

export default StatsCard;
