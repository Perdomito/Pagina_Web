const axios = require('axios');

const pythonApi = axios.create({
  baseURL: process.env.PYTHON_API_URL || 'https://laevateinn707-gnit-api.hf.space',
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 30000
});

pythonApi.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.detail || error.response?.data?.error || error.message;
    const status = error.response?.status || 500;
    const err = new Error(message);
    err.status = status;
    throw err;
  }
);

module.exports = pythonApi;