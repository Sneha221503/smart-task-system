import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const navItems = [
  { icon: '📊', label: 'Dashboard',    filter: 'all' },
  { icon: '📋', label: 'All Tasks',    filter: 'all' },
  { icon: '🔵', label: 'Todo',         filter: 'todo' },
  { icon: '🟡', label: 'In Progress',  filter: 'in_progress' },
  { icon: '✅', label: 'Completed',    filter: 'done' },
];

const Sidebar = ({ activeFilter, onFilterChange, stats }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">⚡</div>
          <span className="sidebar-logo-text">SmartFlow</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        <span className="nav-label">Navigation</span>
        {navItems.map((item) => (
          <button
            key={item.filter + item.label}
            className={`nav-item ${activeFilter === item.filter && item.label !== 'Dashboard' ? 'active' : ''}`}
            onClick={() => onFilterChange(item.filter)}
          >
            <span className="nav-item-icon">{item.icon}</span>
            {item.label}
            {item.filter === 'todo' && stats?.todo > 0 && (
              <span className="nav-badge">{stats.todo}</span>
            )}
            {item.filter === 'in_progress' && stats?.in_progress > 0 && (
              <span className="nav-badge">{stats.in_progress}</span>
            )}
          </button>
        ))}

        <span className="nav-label" style={{ marginTop: '16px' }}>Priority</span>
        {['high', 'medium', 'low'].map((p) => (
          <button
            key={p}
            className={`nav-item ${activeFilter === p ? 'active' : ''}`}
            onClick={() => onFilterChange(p)}
          >
            <span className="nav-item-icon">
              {p === 'high' ? '🔴' : p === 'medium' ? '🟡' : '🟢'}
            </span>
            {p.charAt(0).toUpperCase() + p.slice(1)} Priority
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="user-info">
          <div className="user-avatar">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div className="user-details" style={{ overflow: 'hidden' }}>
            <div className="user-name">{user?.name}</div>
            <div className="user-email">{user?.email}</div>
          </div>
        </div>
        <button className="btn btn-ghost btn-full" onClick={handleLogout}>
          🚪 LogOut
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
