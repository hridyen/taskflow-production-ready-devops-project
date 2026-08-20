import { useState, useEffect } from 'react';

/**
 * TaskForm component for creating or editing tasks
 * @param {Object} props
 * @param {Object} [props.editingTask] - Task object being edited (null if creating)
 * @param {Function} props.onSubmit - Callback function when form is submitted
 * @param {Function} [props.onCancel] - Callback function to cancel editing
 * @param {boolean} props.isLoading - Submitting loading state
 */
export default function TaskForm({ editingTask, onSubmit, onCancel, isLoading }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  // Sync state with editingTask when it changes
  useEffect(() => {
    if (editingTask) {
      setTitle(editingTask.title || '');
      setDescription(editingTask.description || '');
      setError('');
    } else {
      setTitle('');
      setDescription('');
      setError('');
    }
  }, [editingTask]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    // Client-side validation
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError('Task title is required');
      return;
    }

    onSubmit({
      title: trimmedTitle,
      description: description.trim(),
    });

    // Reset form after submission if NOT editing (parent will handle resetting editingTask)
    if (!editingTask) {
      setTitle('');
      setDescription('');
    }
  };

  return (
    <div className="glass-panel">
      <h2 className="panel-title">
        {editingTask ? (
          <>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
            Edit Task
          </>
        ) : (
          <>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            Create New Task
          </>
        )}
      </h2>
      <form onSubmit={handleSubmit} noValidate>
        <div className="form-group">
          <label htmlFor="task-title" className="form-label">Title <span style={{ color: 'var(--danger)' }}>*</span></label>
          <input
            id="task-title"
            type="text"
            className="form-input"
            placeholder="e.g. Design Landing Page"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={isLoading}
            maxLength={100}
            required
          />
          {error && <p style={{ color: 'var(--danger)', fontSize: '0.8rem', marginTop: '0.25rem' }}>{error}</p>}
        </div>

        <div className="form-group">
          <label htmlFor="task-desc" className="form-label">Description</label>
          <textarea
            id="task-desc"
            className="form-textarea"
            placeholder="Add details about this task..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={isLoading}
            maxLength={1000}
          />
        </div>

        <div className="form-actions">
          {editingTask && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onCancel}
              disabled={isLoading}
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <svg className="spinner-mini" style={{ animation: 'spin 1s linear infinite', marginRight: '5px' }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.25"></circle><path d="M12 2v4"></path></svg>
                Saving...
              </>
            ) : editingTask ? 'Update Task' : 'Add Task'}
          </button>
        </div>
      </form>
    </div>
  );
}
