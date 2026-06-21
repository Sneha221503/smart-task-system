const isOverdue = (due) => due && new Date(due) < new Date();

const formatDate = (due) => {
  if (!due) return null;
  const d = new Date(due);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

const statusCycle = { todo: 'in_progress', in_progress: 'done', done: 'todo' };
const checkIcon  = { todo: '', in_progress: '⏳', done: '✓' };

const TaskCard = ({ task, onEdit, onDelete, onStatusChange }) => {
  const overdue = isOverdue(task.due_date) && task.status !== 'done';

  return (
    <div className={`task-card ${task.status === 'done' ? 'done-card' : ''}`}>
      {/* Status toggle button */}
      <button
        className={`task-check-btn ${task.status === 'done' ? 'checked' : task.status === 'in_progress' ? 'in-progress' : ''}`}
        title={`Click to mark as ${statusCycle[task.status]}`}
        onClick={() => onStatusChange(task.id, statusCycle[task.status])}
      >
        {checkIcon[task.status]}
      </button>

      <div className="task-body">
        <div className="task-top">
          <h3 className={`task-title ${task.status === 'done' ? 'striked' : ''}`}>
            {task.title}
          </h3>
          <div className="task-actions">
            <button
              className="btn btn-ghost btn-icon"
              title="Edit"
              onClick={() => onEdit(task)}
            >✏️</button>
            <button
              className="btn btn-ghost btn-icon"
              title="Delete"
              onClick={() => onDelete(task.id)}
              style={{ color: 'var(--danger)' }}
            >🗑️</button>
          </div>
        </div>

        {task.description && (
          <p className="task-desc">{task.description}</p>
        )}

        <div className="task-meta">
          <span className={`badge badge-${task.priority}`}>
            {task.priority === 'high' ? '🔴' : task.priority === 'medium' ? '🟡' : '🟢'}
            {' '}{task.priority}
          </span>
          <span className={`badge badge-${task.status}`}>
            {task.status.replace('_', ' ')}
          </span>
          {task.category && (
            <span className="badge badge-cat">🏷 {task.category}</span>
          )}
          {task.due_date && (
            <span className={`due-tag ${overdue ? 'overdue' : ''}`}>
              📅 {overdue ? '⚠ Overdue · ' : ''}{formatDate(task.due_date)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskCard;
