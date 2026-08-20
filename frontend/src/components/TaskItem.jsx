/**
 * Format timestamp to a human-readable date
 * @param {string} dateString
 */
function formatDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * TaskItem component representing a single task card
 * @param {Object} props
 * @param {Object} props.task
 * @param {Function} props.onDelete
 * @param {Function} props.onEdit
 * @param {Function} props.onStatusChange
 */
export default function TaskItem({ task, onDelete, onEdit, onStatusChange }) {
  const handleStatusChange = (e) => {
    onStatusChange(task.id, e.target.value);
  };

  return (
    <article className={`task-card ${task.status}`}>
      <div className="task-header">
        <h3 className="task-title" title={task.title}>
          {task.title}
        </h3>
        <span className={`task-badge ${task.status}`}>
          {task.status.replace('-', ' ')}
        </span>
      </div>

      <p className="task-body">
        {task.description || <em style={{ opacity: 0.5 }}>No description provided.</em>}
      </p>

      <div className="task-footer">
        <time dateTime={task.createdAt}>
          {formatDate(task.createdAt)}
        </time>

        <div className="task-actions">
          {/* Status quick toggle select */}
          <div className="status-select-wrapper">
            <select
              className="status-select"
              value={task.status}
              onChange={handleStatusChange}
              aria-label="Change task status"
            >
              <option value="pending">Pending</option>
              <option value="in-progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
            <span className="select-arrow" aria-hidden="true">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="6 9 12 15 18 9"></polyline></svg>
            </span>
          </div>

          {/* Edit Button */}
          <button
            className="icon-btn edit-btn"
            onClick={() => onEdit(task)}
            title="Edit Task"
            aria-label="Edit Task"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
          </button>

          {/* Delete Button */}
          <button
            className="icon-btn delete-btn"
            onClick={() => {
              if (window.confirm(`Are you sure you want to delete "${task.title}"?`)) {
                onDelete(task.id);
              }
            }}
            title="Delete Task"
            aria-label="Delete Task"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
          </button>
        </div>
      </div>
    </article>
  );
}
