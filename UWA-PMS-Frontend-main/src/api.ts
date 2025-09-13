import axios from 'axios';

export default axios.create({
  baseURL: 'http://localhost/uwu_pms_backend/api/',
  headers: { 'Content-Type': 'application/json' }
});
