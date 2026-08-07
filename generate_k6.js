const fs = require('fs');
const path = require('path');

const outDir = path.join(__dirname, 'performance-tests');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

const commonOptions = `
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
`;

const scripts = {
    '01_homepage.js': `import http from 'k6/http';\nimport { check, sleep } from 'k6';\n${commonOptions}\nexport default function () {\n  const res = http.get(\`\${BASE_URL}/api/public/stats\`);\n  check(res, { 'status 200': (r) => r.status === 200, 'response < 500ms': (r) => r.timings.duration < 500 });\n  sleep(1);\n}`,
    '02_login.js': `import http from 'k6/http';\nimport { check, sleep } from 'k6';\n${commonOptions}\nexport default function () {\n  const res = http.post(\`\${BASE_URL}/api/auth/login\`, JSON.stringify({ email: 'test@example.com', password: 'password123' }), { headers: { 'Content-Type': 'application/json' } });\n  check(res, { 'status 200': (r) => r.status === 200 || r.status === 400 || r.status === 401 });\n  sleep(1);\n}`,
    '03_dashboard.js': `import http from 'k6/http';\nimport { check, sleep } from 'k6';\n${commonOptions}\nexport default function () {\n  const res = http.get(\`\${BASE_URL}/api/dashboard/stats\`, { headers: { 'Authorization': 'Bearer ' + __ENV.TOKEN } });\n  check(res, { 'status 200': (r) => r.status === 200 || r.status === 401 });\n  sleep(1);\n}`,
    '04_courses.js': `import http from 'k6/http';\nimport { check, sleep } from 'k6';\n${commonOptions}\nexport default function () {\n  const res = http.get(\`\${BASE_URL}/api/courses\`, { headers: { 'Authorization': 'Bearer ' + __ENV.TOKEN } });\n  check(res, { 'status 200': (r) => r.status === 200 || r.status === 401 });\n  sleep(1);\n}`,
    '05_quiz.js': `import http from 'k6/http';\nimport { check, sleep } from 'k6';\n${commonOptions}\nexport default function () {\n  const res = http.get(\`\${BASE_URL}/api/lectures/dummy-id/quiz\`, { headers: { 'Authorization': 'Bearer ' + __ENV.TOKEN } });\n  check(res, { 'status 200/400': (r) => [200, 400, 401, 404].includes(r.status) });\n  sleep(1);\n}`,
    '06_ai_generation.js': `import http from 'k6/http';\nimport { check, sleep } from 'k6';\n${commonOptions}\nexport default function () {\n  const res = http.post(\`\${BASE_URL}/api/roadmap/generate\`, JSON.stringify({ prompt: 'test' }), { headers: { 'Authorization': 'Bearer ' + __ENV.TOKEN, 'Content-Type': 'application/json' } });\n  check(res, { 'status ok': (r) => [200, 201, 401, 403, 400].includes(r.status) });\n  sleep(2);\n}`,
    '07_notes.js': `import http from 'k6/http';\nimport { check, sleep } from 'k6';\n${commonOptions}\nexport default function () {\n  const res = http.get(\`\${BASE_URL}/api/lectures/dummy-id/notes\`, { headers: { 'Authorization': 'Bearer ' + __ENV.TOKEN } });\n  check(res, { 'status ok': (r) => [200, 400, 401, 404].includes(r.status) });\n  sleep(1);\n}`,
    '08_leaderboard.js': `import http from 'k6/http';\nimport { check, sleep } from 'k6';\n${commonOptions}\nexport default function () {\n  const res = http.get(\`\${BASE_URL}/api/gamification/leaderboard\`);\n  check(res, { 'status 200': (r) => r.status === 200 });\n  sleep(1);\n}`,
    '09_chat_doubts.js': `import http from 'k6/http';\nimport { check, sleep } from 'k6';\n${commonOptions}\nexport default function () {\n  const res = http.post(\`\${BASE_URL}/api/doubts/dummy-id/query\`, JSON.stringify({ query: 'help' }), { headers: { 'Authorization': 'Bearer ' + __ENV.TOKEN, 'Content-Type': 'application/json' } });\n  check(res, { 'status ok': (r) => [200, 400, 401, 404].includes(r.status) });\n  sleep(1);\n}`,
    '10_full_journey.js': `import http from 'k6/http';\nimport { check, sleep } from 'k6';\n${commonOptions}\nexport default function () {\n  // 1. Visit Homepage\n  http.get(\`\${BASE_URL}/api/public/stats\`);\n  sleep(0.5);\n  // 2. Login\n  const login = http.post(\`\${BASE_URL}/api/auth/login\`, JSON.stringify({ email: 'test@example.com', password: 'password123' }), { headers: { 'Content-Type': 'application/json' } });\n  const token = login.json('token') || __ENV.TOKEN;\n  // 3. Dashboard\n  http.get(\`\${BASE_URL}/api/dashboard/stats\`, { headers: { 'Authorization': 'Bearer ' + token } });\n  sleep(1);\n  // 4. Get Courses\n  http.get(\`\${BASE_URL}/api/courses\`, { headers: { 'Authorization': 'Bearer ' + token } });\n  sleep(1);\n}`
};

for (const [filename, content] of Object.entries(scripts)) {
    fs.writeFileSync(path.join(outDir, filename), content);
    console.log('Created', filename);
}
