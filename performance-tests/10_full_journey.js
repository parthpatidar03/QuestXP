import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
    scenarios: {
        ramp_up: {
            executor: 'ramping-vus',
            startVUs: 0,
            stages: [
                { duration: '30s', target: 50 },
                { duration: '1m', target: 50 },
                { duration: '30s', target: 0 },
            ],
            gracefulRampDown: '30s',
        },
    },
    thresholds: {
        http_req_duration: ['p(95)<500', 'p(99)<1000'],
        http_req_failed: ['rate<0.01'],
    },
};
const BASE_URL = __ENV.BASE_URL || 'http://localhost:5000';

export default function () {
  // 1. Visit Homepage
  http.get(`${BASE_URL}/api/public/stats`);
  sleep(0.5);
  // 2. Login
  const login = http.post(`${BASE_URL}/api/auth/login`, JSON.stringify({ email: 'test@example.com', password: 'password123' }), { headers: { 'Content-Type': 'application/json' } });
  const token = login.json('token') || __ENV.TOKEN;
  // 3. Dashboard
  http.get(`${BASE_URL}/api/dashboard/stats`, { headers: { 'Authorization': 'Bearer ' + token } });
  sleep(1);
  // 4. Get Courses
  http.get(`${BASE_URL}/api/courses`, { headers: { 'Authorization': 'Bearer ' + token } });
  sleep(1);
}