const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:9001/api';

/**
 * Helper to handle fetch responses and error logging
 */
async function handleResponse(response) {
  if (!response.ok) {
    let errorMsg = `HTTP error! Status: ${response.status}`;
    try {
      const errorData = await response.json();
      if (errorData && errorData.error) {
        errorMsg = errorData.error;
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
   * @param {string} [status] - 'pending', 'in-progress', 'completed'
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
   * @param {string} id
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
   * Update an existing task
   * @param {string} id
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
   * @param {string} id
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
