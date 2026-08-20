import TaskItem from './TaskItem';

/**
 * TaskList component to filter, search, and list tasks
 * @param {Object} props
 * @param {Array} props.tasks - Array of tasks
 * @param {string} props.filterStatus - Current filter status ('all', 'pending', 'in-progress', 'completed')
 * @param {Function} props.setFilterStatus - State setter for filterStatus
 * @param {string} props.searchQuery - Current search query
 * @param {Function} props.setSearchQuery - State setter for searchQuery
 * @param {Function} props.onDelete - Callback when task is deleted
 * @param {Function} props.onEdit - Callback when task edit is requested
 * @param {Function} props.onStatusChange - Callback when task status changes
 * @param {boolean} props.isLoading - Loading state flag
 */
export default function TaskList({
  tasks,
  filterStatus,
  setFilterStatus,
  searchQuery,
  setSearchQuery,
  onDelete,
  onEdit,
  onStatusChange,
  isLoading,
}) {
  
  // Filter and search tasks locally for snappy UI performance
  const filteredTasks = tasks.filter((task) => {
    const matchesStatus = filterStatus === 'all' || task.status === filterStatus;
    const matchesSearch =
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (task.description && task.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="tasks-container">
      {/* Search and Filter Controls */}
      <div className="dashboard-controls">
        <div className="search-wrapper">
          <span className="search-icon" aria-hidden="true">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          </span>
          <input
            type="text"
            className="search-input"
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Search tasks"
          />
        </div>

        <div className="filter-tabs" role="tablist" aria-label="Filter tasks by status">
          {['all', 'pending', 'in-progress', 'completed'].map((status) => (
            <button
              key={status}
              role="tab"
              aria-selected={filterStatus === status}
              className={`filter-tab ${filterStatus === status ? 'active' : ''}`}
              onClick={() => setFilterStatus(status)}
            >
              {status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Loading & Lists Display */}
      {isLoading ? (
        <div className="spinner" role="status" aria-label="Loading tasks"></div>
      ) : filteredTasks.length > 0 ? (
        <div className="tasks-grid">
          {filteredTasks.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              onDelete={onDelete}
              onEdit={onEdit}
              onStatusChange={onStatusChange}
            />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-icon" aria-hidden="true">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="9" y1="15" x2="15" y2="15"></line><line x1="9" y1="11" x2="15" y2="11"></line><line x1="9" y1="18" x2="11" y2="18"></line></svg>
          </div>
          <h3 className="empty-title">No tasks found</h3>
          <p className="empty-desc">
            {searchQuery
              ? `No tasks match your search query "${searchQuery}"`
              : filterStatus !== 'all'
              ? `No tasks found with status "${filterStatus.replace('-', ' ')}"`
              : "You don't have any tasks yet. Create one on the left to get started!"}
          </p>
        </div>
      )}
    </div>
  );
}
