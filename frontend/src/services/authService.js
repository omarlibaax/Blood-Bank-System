import api from './api';

const login = async (username, password) => {
  const response = await api.post('/auth/signin', { username, password });
  if (response.data && response.data.token) {
    localStorage.setItem('user', JSON.stringify(response.data));
  }
  return response.data;
};

const register = async (fullName, username, email, password, phone, role) => {
  return await api.post('/auth/signup', {
    fullName,
    username,
    email,
    password,
    phone,
    role,
  });
};

const logout = () => {
  localStorage.removeItem('user');
};

const getCurrentUser = () => {
  const userStr = localStorage.getItem('user');
  if (userStr) {
    try {
      return JSON.parse(userStr);
    } catch (e) {
      return null;
    }
  }
  return null;
};

const authService = {
  login,
  register,
  logout,
  getCurrentUser,
};

export default authService;
