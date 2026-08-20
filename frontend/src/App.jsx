import { useState, useEffect, useCallback } from 'react';
import { api } from './services/api';
import TaskForm from './components/TaskForm';
import TaskList from './components/TaskList';

export default function App() {
  const [tasks, setTasks] = useState([]);
  const [editingTask, setEditingTask] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Status & UI States
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dbHealthy, setDbHealthy] = useState('checking'); // 'checking' | 'healthy' | 'unhealthy'
  const [errorMessage, setErrorMessage] = useState('');
  const [toasts, setToasts] = useState([]);

  // Helper to add toast messages
  const addToast = useCallback((type, message) => {
    const id = Date.now() + Math.random().toString(36).substr(2, 5);
    setToasts((prev) => [...prev, { id, type, message }]);
    
    // Auto-remove toast after 4 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 4000);
  }, []);

  // Fetch all tasks from server
  const loadTasks = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    setErrorMessage('');
    try {
      const data = await api.getTasks();
      setTasks(data);
    } catch (err) {
      console.error(err);
      setErrorMessage(err.message || 'Failed to fetch tasks from the server.');
      addToast('error', 'Error connecting to database or API');
    } finally {
      if (!silent) setIsLoading(false);
    }
  }, [addToast]);

  // Check API health
  const checkHealth = useCallback(async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:9001/api'}/db-health`);
      if (response.ok) {
        setDbHealthy('healthy');
      } else {
        setDbHealthy('unhealthy');
      }
    } catch {
      setDbHealthy('unhealthy');
    }
  }, []);

  // Initial load
  useEffect(() => {
    checkHealth();
    loadTasks();

    // Check database health periodically every 30 seconds
    const interval = setInterval(() => {
      checkHealth();
    }, 30000);

    return () => clearInterval(interval);
  }, [loadTasks, checkHealth]);

  // Form submission handler (create or update)
  const handleSubmitTask = async (taskData) => {
    setIsSubmitting(true);
    setErrorMessage('');
    try {
      if (editingTask) {
        // Edit Mode
        const updated = await api.updateTask(editingTask.id, taskData);
        addToast('success', `Task "${updated.title}" updated successfully!`);
        setEditingTask(null);
      } else {
        // Create Mode
        const created = await api.createTask(taskData);
        addToast('success', `Task "${created.title}" created successfully!`);
      }
      // Reload tasks list
      await loadTasks(true);
    } catch (err) {
      console.error(err);
      setErrorMessage(err.message || 'Failed to save task.');
      addToast('error', err.message || 'Failed to save task.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete task handler
  const handleDeleteTask = async (id) => {
    setErrorMessage('');
    try {
      // Find the task name for the toast
      const taskToDelete = tasks.find(t => t.id === id);
      const title = taskToDelete ? taskToDelete.title : 'Task';

      // Perform deletion
      await api.deleteTask(id);
      addToast('success', `Task "${title}" deleted.`);
      
      // Update state locally and trigger silent load
      setTasks((prev) => prev.filter((t) => t.id !== id));
      if (editingTask && editingTask.id === id) {
        setEditingTask(null);
      }
      loadTasks(true);
    } catch (err) {
      console.error(err);
      setErrorMessage(err.message || 'Failed to delete task.');
      addToast('error', err.message || 'Failed to delete task.');
    }
  };

  // Status Change Quick Action
  const handleStatusChange = async (id, newStatus) => {
    // Optimistic local state update
    const previousTasks = [...tasks];
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: newStatus } : t))
    );

    try {
      const updated = await api.updateTask(id, { status: newStatus });
      addToast('info', `Status of "${updated.title}" changed to ${newStatus.replace('-', ' ')}.`);
      
      // Fetch latest from database silently to ensure synchronization
      loadTasks(true);
    } catch (err) {
      console.error(err);
      addToast('error', 'Failed to update status on server.');
      // Rollback on error
      setTasks(previousTasks);
    }
  };

  return (
    <div className="app-container">
      {/* App Header */}
      <header className="app-header">
        <div className="brand-section">
          <div className="brand-logo">TF</div>
          <div>
            <h1 className="app-title">TaskFlow</h1>
            <p className="app-subtitle">Organize and track your daily operations</p>
          </div>
        </div>

        <div className="db-status">
          <span className={`status-dot ${dbHealthy}`}></span>
          <span>
            {dbHealthy === 'checking' && 'Checking status...'}
            {dbHealthy === 'healthy' && 'Database Online'}
            {dbHealthy === 'unhealthy' && 'Database Offline'}
          </span>
        </div>
      </header>

      {/* API Error Banner */}
      {errorMessage && (
        <div className="alert-banner error" role="alert">
          <span><strong>Connection Alert:</strong> {errorMessage}</span>
          <button className="alert-close" onClick={() => setErrorMessage('')} aria-label="Close alert">×</button>
        </div>
      )}

      {/* Main Grid Content */}
      <main style={{ gridColumn: 1 / -1, display: 'contents' }}>
        {/* Left Side: Create / Edit Form */}
        <section aria-label="Task Form Panel">
          <TaskForm
            editingTask={editingTask}
            onSubmit={handleSubmitTask}
            onCancel={() => setEditingTask(null)}
            isLoading={isSubmitting}
          />
        </section>

        {/* Right Side: Tasks List View */}
        <section aria-label="Tasks List View">
          <div className="glass-panel">
            <h2 className="panel-title">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
              My Tasks
            </h2>
            
            <TaskList
              tasks={tasks}
              filterStatus={filterStatus}
              setFilterStatus={setFilterStatus}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              onDelete={handleDeleteTask}
              onEdit={setEditingTask}
              onStatusChange={handleStatusChange}
              isLoading={isLoading}
            />
          </div>
        </section>
      </main>

      {/* Dynamic Toast Notifications */}
      <div className="toast-container" aria-live="polite">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast ${toast.type}`}>
            <span className="toast-icon">
              {toast.type === 'success' && '✓'}
              {toast.type === 'info' && '🛈'}
              {toast.type === 'error' && '⚠'}
            </span>
            <div className="toast-content">{toast.message}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
