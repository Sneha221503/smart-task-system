import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import Sidebar from '../components/Sidebar';
import StatsCard from '../components/StatsCard';
import TaskCard from '../components/TaskCard';
import TaskModal from '../components/TaskModal';

const STATUS_FILTERS = ['all', 'todo', 'in_progress', 'done'];
const PRIORITY_FILTERS = ['high', 'medium', 'low'];

const Dashboard = () => {
  const { user } = useAuth();

  const [tasks, setTasks]           = useState([]);
  const [stats, setStats]           = useState(null);
  const [activeFilter, setActiveFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [loading, setLoading]       = useState(true);
  const [modalOpen, setModalOpen]   = useState(false);
  const [editTask, setEditTask]     = useState(null);

  // Fetch tasks
  const fetchTasks = useCallback(async () => {
    try {
      const params = {};
      if (STATUS_FILTERS.includes(activeFilter) && activeFilter !== 'all') params.status = activeFilter;
      if (PRIORITY_FILTERS.includes(activeFilter)) params.priority = activeFilter;
      if (priorityFilter) params.priority = priorityFilter;

      const [tasksRes, statsRes] = await Promise.all([
        api.get('/tasks', { params }),
        api.get('/tasks/stats'),
      ]);
      setTasks(tasksRes.data);
      setStats(statsRes.data);
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [activeFilter, priorityFilter]);

  useEffect(() => {
    const loadData = async () => {
      await fetchTasks();
    };
    loadData();
  }, [fetchTasks]);

  // Create task
  const handleCreate = async (form) => {
    await api.post('/tasks', form);
    fetchTasks();
  };

  // Update task
  const handleUpdate = async (form) => {
    await api.put(`/tasks/${editTask.id}`, form);
    setEditTask(null);
    fetchTasks();
  };

  // Delete task
  const handleDelete = async (id) => {
    if (!window.confirm('Delete this task?')) return;
    await api.delete(`/tasks/${id}`);
    fetchTasks();
  };

  // Status cycle
  const handleStatusChange = async (id, newStatus) => {
    await api.patch(`/tasks/${id}/status`, { status: newStatus });
    fetchTasks();
  };

  const openCreate = () => { setEditTask(null); setModalOpen(true); };
  const openEdit   = (task) => { setEditTask(task); setModalOpen(true); };
  const closeModal = () => { setModalOpen(false); setEditTask(null); };

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return '🌅 Good Morning';
    if (h < 17) return '☀️ Good Afternoon';
    return '🌙 Good Evening';
  };

  return (
    <div className="layout">
      <Sidebar
        activeFilter={activeFilter}
        onFilterChange={(f) => { setActiveFilter(f); setPriorityFilter(''); }}
        stats={stats}
      />

      <main className="main-content">
        {/* Header */}
        <div className="page-header">
          <div>
            <h1 className="page-title">{greeting()}, {user?.name?.split(' ')[0]}! 👋</h1>
            <p className="page-subtitle">
              {stats?.todo ?? 0} tasks pending · {stats?.done ?? 0} completed
            </p>
          </div>
          <button className="btn btn-primary" onClick={openCreate}>
            ➕ New Task
          </button>
        </div>

        {/* Stats */}
        <StatsCard stats={stats} />

        {/* Task List */}
        <div className="tasks-section">
          <div className="tasks-toolbar">
            <div className="filter-tabs">
              {[
                { value: 'all',         label: 'All' },
                { value: 'todo',        label: '📋 Todo' },
                { value: 'in_progress', label: '⚡ In Progress' },
                { value: 'done',        label: '✅ Done' },
              ].map((tab) => (
                <button
                  key={tab.value}
                  className={`filter-tab ${activeFilter === tab.value ? 'active' : ''}`}
                  onClick={() => { setActiveFilter(tab.value); setPriorityFilter(''); }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="toolbar-right">
              <select
                className="priority-filter"
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
              >
                <option value="">All Priorities</option>
                <option value="high">🔴 High</option>
                <option value="medium">🟡 Medium</option>
                <option value="low">🟢 Low</option>
              </select>
            </div>
          </div>

          {/* Tasks */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <div className="spinner" style={{ margin: '0 auto' }} />
            </div>
          ) : tasks.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📭</div>
              <h3 className="empty-title">No tasks found</h3>
              <p className="empty-sub">Click &quot;New Task&quot; to get started!</p>
            </div>
          ) : (
            <div className="tasks-list">
              {tasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onEdit={openEdit}
                  onDelete={handleDelete}
                  onStatusChange={handleStatusChange}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Modal */}
      <TaskModal
        isOpen={modalOpen}
        onClose={closeModal}
        onSubmit={editTask ? handleUpdate : handleCreate}
        editTask={editTask}
      />
    </div>
  );
};

export default Dashboard;
