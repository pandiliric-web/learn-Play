const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

class AuthAPI {
  constructor() {
    this.baseURL = `${API_BASE_URL}/auth`;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      credentials: 'include', // Include cookies
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    return fetch(url, config);
  }

  async register(name, email, password, role = 'student', passwordRequirement = 'medium', allowRegistration = true, maxUsers = 1000) {
    return this.request('/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password, role, passwordRequirement, allowRegistration, maxUsers }),
    });
  }

  async login(email, password, loginAttemptsLimit, lockoutDuration) {
    return this.request('/login', {
      method: 'POST',
      body: JSON.stringify({ email, password, loginAttemptsLimit, lockoutDuration }),
    });
  }

  async logout() {
    return this.request('/logout', {
      method: 'POST',
    });
  }

  async getMe() {
    return this.request('/me', {
      method: 'GET',
    });
  }

  async updateMe(profile) {
    return this.request('/me', {
      method: 'PUT',
      body: JSON.stringify(profile),
    });
  }

  async getAllUsers() {
    return this.request('/users', {
      method: 'GET',
    });
  }

  async updateUser(userId, userData) {
    return this.request(`/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  }

  async deleteUser(userId) {
    return this.request(`/users/${userId}`, {
      method: 'DELETE',
    });
  }

  async createUser(userData) {
    return this.request('/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async forgotPassword(email) {
    return this.request('/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async resetPassword(email, otp, newPassword) {
    return this.request('/reset-password', {
      method: 'POST',
      body: JSON.stringify({ email, otp, newPassword }),
    });
  }
}

class QuizAPI {
  constructor() {
    this.baseURL = `${API_BASE_URL}/quizzes`;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };
    return fetch(url, config);
  }

  async getQuizzes() {
    return this.request('/', { method: 'GET' });
  }

  async createQuiz(quiz) {
    return this.request('/', {
      method: 'POST',
      body: JSON.stringify(quiz),
    });
  }

  async updateQuiz(quizId, quiz) {
    return this.request(`/${quizId}`, {
      method: 'PUT',
      body: JSON.stringify(quiz),
    });
  }

  async deleteQuiz(quizId) {
    return this.request(`/${quizId}`, {
      method: 'DELETE',
    });
  }

  async uploadDocument(file) {
    const formData = new FormData();
    formData.append('document', file);
    
    const url = `${this.baseURL}/upload-document`;
    return fetch(url, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });
  }
}

class SubjectAPI {
  constructor() {
    this.baseURL = `${API_BASE_URL}/subjects`;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };
    return fetch(url, config);
  }

  async getSubjects() {
    return this.request('/', { method: 'GET' });
  }

  async createSubject(subject) {
    return this.request('/', {
      method: 'POST',
      body: JSON.stringify(subject),
    });
  }

  async deleteSubject(subjectId) {
    return this.request(`/${subjectId}`, { method: 'DELETE' });
  }
}

export const authAPI = new AuthAPI();
export const quizAPI = new QuizAPI();
export const subjectAPI = new SubjectAPI();

class ProgressAPI {
  constructor() {
    this.baseURL = `${API_BASE_URL}/progress`;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };
    return fetch(url, config);
  }

  async getStudents() {
    return this.request('/students', { method: 'GET' });
  }

  async getStudentProgress(studentId) {
    return this.request(`/students/${studentId}/progress`, { method: 'GET' });
  }

  async saveProgress(progressData) {
    return this.request('/', {
      method: 'POST',
      body: JSON.stringify(progressData),
    });
  }
}

export const progressAPI = new ProgressAPI();

class ProgressReportAPI {
  constructor() {
    this.baseURL = `${API_BASE_URL}/progress-reports`;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };
    return fetch(url, config);
  }

  async sendProgressReport(studentId, options = {}) {
    return this.request('/send', {
      method: 'POST',
      body: JSON.stringify({
        studentId,
        dateRange: options.dateRange || null,
        sendToStudent: options.sendToStudent !== false,
        sendToParent: options.sendToParent !== false,
        customParentEmail: options.customParentEmail || null
      }),
    });
  }

  async sendWeeklySummary(studentId, options = {}) {
    return this.request('/weekly-summary', {
      method: 'POST',
      body: JSON.stringify({
        studentId,
        sendToStudent: options.sendToStudent !== false,
        sendToParent: options.sendToParent !== false
      }),
    });
  }

  async getProgressReportData(studentId, dateRange = null) {
    const params = new URLSearchParams();
    if (dateRange && dateRange.startDate) {
      params.append('startDate', dateRange.startDate);
    }
    if (dateRange && dateRange.endDate) {
      params.append('endDate', dateRange.endDate);
    }
    const queryString = params.toString();
    return this.request(`/data/${studentId}${queryString ? '?' + queryString : ''}`, {
      method: 'GET',
    });
  }
}

export const progressReportAPI = new ProgressReportAPI();

class GameSettingsAPI {
  constructor() {
    this.baseURL = `${API_BASE_URL}/game-settings`;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };
    return fetch(url, config);
  }

  async getGameSettings(gameName) {
    return this.request(`/${gameName}`, { method: 'GET' });
  }

  async updateGameSettings(gameName, settings) {
    return this.request(`/${gameName}`, {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  }

  async resetGameSettings(gameName) {
    return this.request(`/${gameName}/reset`, { method: 'DELETE' });
  }

  async getAllGameSettings() {
    return this.request('/', { method: 'GET' });
  }
}

export const gameSettingsAPI = new GameSettingsAPI();
