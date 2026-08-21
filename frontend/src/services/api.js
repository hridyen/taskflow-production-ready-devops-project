// ==========================================
// TaskFlow Frontend: API Consumption Service
// ==========================================
// This service abstracts fetch requests to the backend API.
// It maps JavaScript calls to HTTP requests and handles response statuses.

// Resolve the base URL for the API from environment variables (configured in Docker or Vite envs).
// Defaults to local backend service on port 9001 if not specified.
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:9001/api';

/**
 * Helper to handle fetch responses and error logging
 * Checks response.ok (status 200-299). If failed, parses potential error messages
 * returned by the Express backend and throws a descriptive JavaScript Error.
 */
async function handleResponse(response) {
  if (!response.ok) {
    let errorMsg = `HTTP error! Status: ${response.status}`;
    try {
      const errorData = await response.json();
      if (errorData && errorData.error) {
        errorMsg = errorData.error; // Extract express JSON error message
      }
    } catch {
      // JSON parsing failed, keep default status error message
    }
    throw new Error(errorMsg);
  }
  return response.json();
}

export const api = {
  /**
   * Get all tasks, optionally filtered by status
   * @param {string} [status] - 'pending', 'in-progress', 'completed', or 'all'
   */
  async getTasks(status) {
    let url = `${API_BASE_URL}/tasks`;
    if (status && status !== 'all') {
      url += `?status=${encodeURIComponent(status)}`;
    }
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });
    return handleResponse(response);
  },

  /**
   * Get a single task by ID
   * @param {string} id - UUID format matching backend validations
   */
  async getTaskById(id) {
    const response = await fetch(`${API_BASE_URL}/tasks/${id}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });
    return handleResponse(response);
  },

  /**
   * Create a new task
   * @param {Object} taskData
   * @param {string} taskData.title
   * @param {string} [taskData.description]
   */
  async createTask(taskData) {
    const response = await fetch(`${API_BASE_URL}/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(taskData),
    });
    return handleResponse(response);
  },

  /**
   * Update an existing task's fields
   * @param {string} id - UUID of the target task
   * @param {Object} taskData
   * @param {string} [taskData.title]
   * @param {string} [taskData.description]
   * @param {string} [taskData.status]
   */
  async updateTask(id, taskData) {
    const response = await fetch(`${API_BASE_URL}/tasks/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(taskData),
    });
    return handleResponse(response);
  },

  /**
   * Delete a task
   * @param {string} id - UUID of the target task
   */
  async deleteTask(id) {
    const response = await fetch(`${API_BASE_URL}/tasks/${id}`, {
      method: 'DELETE',
      headers: {
        'Accept': 'application/json',
      },
    });
    return handleResponse(response);
  },
};
