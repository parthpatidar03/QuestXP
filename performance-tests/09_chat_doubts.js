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
  const res = http.post(`${BASE_URL}/api/doubts/dummy-id/query`, JSON.stringify({ query: 'help' }), { headers: { 'Authorization': 'Bearer ' + __ENV.TOKEN, 'Content-Type': 'application/json' } });
  check(res, { 'status ok': (r) => [200, 400, 401, 404].includes(r.status) });
  sleep(1);
}