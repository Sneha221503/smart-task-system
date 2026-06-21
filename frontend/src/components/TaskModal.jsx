import { useState } from 'react';

const EMPTY = { title: '', description: '', priority: 'medium', category: '', due_date: '', status: 'todo' };

const TaskModal = ({ isOpen, onClose, onSubmit, editTask }) => {
  const [form, setForm]   = useState(EMPTY);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [prevEditTask, setPrevEditTask] = useState(editTask);
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);

  if (editTask !== prevEditTask || isOpen !== prevIsOpen) {
    setPrevEditTask(editTask);
    setPrevIsOpen(isOpen);
    if (editTask) {
      setForm({
        title:       editTask.title || '',
        description: editTask.description || '',
        priority:    editTask.priority || 'medium',
        category:    editTask.category || '',
        due_date:    editTask.due_date ? editTask.due_date.split('T')[0] : '',
        status:      editTask.status || 'todo',
      });
    } else {
      setForm(EMPTY);
    }
    setError('');
  }

  if (!isOpen) return null;

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) { setError('Task title is required.'); return; }
    setLoading(true);
    setError('');
    try {
      await onSubmit(form);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2 className="modal-title">{editTask ? '✏️ Edit Task' : '➕ New Task'}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && <div className="error-msg">{error}</div>}

            <div className="form-group">
              <label className="form-label">Title *</label>
              <input
                className="form-input"
                name="title"
                value={form.title}
                onChange={handleChange}
                placeholder="What needs to be done?"
                autoFocus
              />
            </div>

            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea
                className="form-textarea"
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="Add some details..."
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Priority</label>
                <select className="form-select" name="priority" value={form.priority} onChange={handleChange}>
                  <option value="high">🔴 High</option>
                  <option value="medium">🟡 Medium</option>
                  <option value="low">🟢 Low</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Status</label>
                <select className="form-select" name="status" value={form.status} onChange={handleChange}>
                  <option value="todo">📋 Todo</option>
                  <option value="in_progress">⚡ In Progress</option>
                  <option value="done">✅ Done</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Category</label>
                <input
                  className="form-input"
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                  placeholder="e.g. Work, Personal"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Due Date</label>
                <input
                  className="form-input"
                  type="date"
                  name="due_date"
                  value={form.due_date}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? '⏳ Saving...' : editTask ? '💾 Update Task' : '✅ Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TaskModal;
