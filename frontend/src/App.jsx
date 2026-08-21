// ==========================================
// TaskFlow Frontend: Main Application React Component
// ==========================================
// This is the core orchestrator of the React user interface.
// Key engineering patterns utilized:
// 1. Asynchronous state managers using useEffect and useCallback hooks.
// 2. Optimistic UI Updates: UI responds instantly to drag-and-drop or quick status actions,
//    reverting state seamlessly in case of network failures.
// 3. Periodic Background Verification: Checks database health every 30s dynamically.
// 4. Interactive UX Feedbacks: Toast notification timers and local error handlers.

import { useState, useEffect, useCallback } from 'react';
import { api } from './services/api';
import TaskForm from './components/TaskForm';
import TaskList from './components/TaskList';

export default function App() {
  // ----------------------------------------------------
  // React State Hook Definitions
  // ----------------------------------------------------
  const [tasks, setTasks] = useState([]); // List of task entities
  const [editingTask, setEditingTask] = useState(null); // Active task object in edit panel
  const [filterStatus, setFilterStatus] = useState('all'); // Active status filter state
  const [searchQuery, setSearchQuery] = useState(''); // Text search query filter
  
  // UI Loading and Monitoring Status States
  const [isLoading, setIsLoading] = useState(true); // Initial fetch loading flag
  const [isSubmitting, setIsSubmitting] = useState(false); // Form save operations load flag
  const [dbHealthy, setDbHealthy] = useState('checking'); // Connection health indicator state
  const [errorMessage, setErrorMessage] = useState(''); // Global error notification message
  const [toasts, setToasts] = useState([]); // Array of active toast notifications

  // ----------------------------------------------------
  // UX Helper: Toast Notifications Manager
  // ----------------------------------------------------
  // Spawns transient messages and schedules auto-removal to avoid memory leaks.
  const addToast = useCallback((type, message) => {
    const id = Date.now() + Math.random().toString(36).substr(2, 5);
    setToasts((prev) => [...prev, { id, type, message }]);
    
    // Auto-remove toast message after 4 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 4000);
  }, []);

  // ----------------------------------------------------
  // API Fetch Action: Load Task Records
  // ----------------------------------------------------
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

  // ----------------------------------------------------
  // API Fetch Action: Verify Connection Health
  // ----------------------------------------------------
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

  // ----------------------------------------------------
  // Component Lifecycle: Initial mounting and Polling
  // ----------------------------------------------------
  useEffect(() => {
    checkHealth();
    loadTasks();

    // Check database connection health periodically (every 30 seconds)
    const interval = setInterval(() => {
      checkHealth();
    }, 30000);

    // Cleanup interval timer on component unmount to prevent background executions
    return () => clearInterval(interval);
  }, [loadTasks, checkHealth]);

  // ----------------------------------------------------
  // CRUD Action: Create or Update Submission Handler
  // ----------------------------------------------------
  const handleSubmitTask = async (taskData) => {
    setIsSubmitting(true);
    setErrorMessage('');
    try {
      if (editingTask) {
        // Update Action: PUT task endpoint
        const updated = await api.updateTask(editingTask.id, taskData);
        addToast('success', `Task "${updated.title}" updated successfully!`);
        setEditingTask(null);
      } else {
        // Create Action: POST task endpoint
        const created = await api.createTask(taskData);
        addToast('success', `Task "${created.title}" created successfully!`);
      }
      // Re-trigger server sync silently (keep current UI lists loaded)
      await loadTasks(true);
    } catch (err) {
      console.error(err);
      setErrorMessage(err.message || 'Failed to save task.');
      addToast('error', err.message || 'Failed to save task.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ----------------------------------------------------
  // CRUD Action: Delete Handler
  // ----------------------------------------------------
  const handleDeleteTask = async (id) => {
    setErrorMessage('');
    try {
      const taskToDelete = tasks.find(t => t.id === id);
      const title = taskToDelete ? taskToDelete.title : 'Task';

      // Perform HTTP DELETE operation
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

  // ----------------------------------------------------
  // Quick Action: Status updates (Optimistic Pattern)
  // ----------------------------------------------------
  const handleStatusChange = async (id, newStatus) => {
    // 1. Optimistic Update: Modify local state before sending HTTP request
    // This makes the transition feel instantaneous for the end-user
    const previousTasks = [...tasks];
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: newStatus } : t))
    );

    try {
      const updated = await api.updateTask(id, { status: newStatus });
      addToast('info', `Status of "${updated.title}" changed to ${newStatus.replace('-', ' ')}.`);
      
      // Re-fetch in background to synchronize any changes (timestamps, etc.)
      loadTasks(true);
    } catch (err) {
      console.error(err);
      addToast('error', 'Failed to update status on server.');
      
      // 2. Rollback Action: Restore original tasks list if the API fails
      setTasks(previousTasks);
    }
  };

  return (
    <div className="app-container">
      {/* ----------------- Header Section ----------------- */}
      <header className="app-header">
        <div className="brand-section">
          <div className="brand-logo">TF</div>
          <div>
            <h1 className="app-title">TaskFlow</h1>
            <p className="app-subtitle">Organize and track your daily operations</p>
          </div>
        </div>

        {/* Database Health Status Indicator */}
        <div className="db-status">
          <span className={`status-dot ${dbHealthy}`}></span>
          <span>
            {dbHealthy === 'checking' && 'Checking status...'}
            {dbHealthy === 'healthy' && 'Database Online'}
            {dbHealthy === 'unhealthy' && 'Database Offline'}
          </span>
        </div>
      </header>

      {/* ----------------- Connection Error Banner ----------------- */}
      {errorMessage && (
        <div className="alert-banner error" role="alert">
          <span><strong>Connection Alert:</strong> {errorMessage}</span>
          <button className="alert-close" onClick={() => setErrorMessage('')} aria-label="Close alert">×</button>
        </div>
      )}

      {/* ----------------- Main Layout Grid ----------------- */}
      <main style={{ gridColumn: 1 / -1, display: 'contents' }}>
        {/* Left column: Create & Update Form */}
        <section aria-label="Task Form Panel">
          <TaskForm
            editingTask={editingTask}
            onSubmit={handleSubmitTask}
            onCancel={() => setEditingTask(null)}
            isLoading={isSubmitting}
          />
        </section>

        {/* Right column: Interactive Filterable Task List */}
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

      {/* ----------------- Dynamic Toast Notifications ----------------- */}
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
