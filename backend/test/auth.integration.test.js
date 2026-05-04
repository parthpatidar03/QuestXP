const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const net = require('node:net');
const { spawn } = require('node:child_process');
const axios = require('axios');
const mongoose = require('mongoose');
const express = require('express');
const cookieParser = require('cookie-parser');

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_access_secret';
process.env.JWT_REFRESH_SECRET = 'test_refresh_secret';
process.env.FRONTEND_URL = 'http://localhost:5173';

const authRoutes = require('../src/routes/auth');
const User = require('../src/models/User');
const Session = require('../src/models/Session');

let mongod;
let server;
let baseURL;
let dbPath;

const getFreePort = () => new Promise((resolve, reject) => {
    const srv = net.createServer();
    srv.listen(0, () => {
        const { port } = srv.address();
        srv.close(() => resolve(port));
    });
    srv.on('error', reject);
});

const startMongo = async () => {
    const port = await getFreePort();
    dbPath = fs.mkdtempSync(path.join(os.tmpdir(), 'questxp-auth-test-'));
    mongod = spawn('mongod', [
        '--quiet',
        '--dbpath', dbPath,
        '--port', String(port),
        '--bind_ip', '127.0.0.1',
    ], { stdio: 'ignore' });

    const uri = `mongodb://127.0.0.1:${port}/questxp-auth-test`;
    let lastError;
    for (let i = 0; i < 50; i += 1) {
        try {
            await mongoose.connect(uri);
            return;
        } catch (error) {
            lastError = error;
            await new Promise(resolve => setTimeout(resolve, 100));
        }
    }
    throw lastError;
};

const stopMongo = async () => {
    await mongoose.disconnect();
    if (mongod) {
        const exited = new Promise(resolve => mongod.once('exit', resolve));
        mongod.kill();
        await Promise.race([
            exited,
            new Promise(resolve => setTimeout(resolve, 3000)),
        ]);
    }
    if (dbPath) {
        for (let i = 0; i < 10; i += 1) {
            try {
                fs.rmSync(dbPath, { recursive: true, force: true });
                break;
            } catch (error) {
                if (i === 9) throw error;
                await new Promise(resolve => setTimeout(resolve, 250));
            }
        }
    }
};

const startServer = async () => {
    const app = express();
    app.use(express.json());
    app.use(cookieParser());
    app.use('/api/auth', authRoutes);
    app.use((err, req, res, next) => {
        res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
    });

    server = app.listen(0);
    await new Promise(resolve => server.once('listening', resolve));
    baseURL = `http://127.0.0.1:${server.address().port}/api`;
};

const stopServer = async () => {
    if (!server) return;
    await new Promise((resolve, reject) => server.close(err => err ? reject(err) : resolve()));
};

const mergeCookies = (jar, setCookieHeaders = []) => {
    const headers = Array.isArray(setCookieHeaders) ? setCookieHeaders : [setCookieHeaders];
    const next = { ...jar };
    headers.filter(Boolean).forEach((header) => {
        const [cookie] = header.split(';');
        const index = cookie.indexOf('=');
        if (index > -1) next[cookie.slice(0, index)] = cookie.slice(index + 1);
    });
    return next;
};

const cookieHeader = (jar) => Object.entries(jar).map(([k, v]) => `${k}=${v}`).join('; ');

const request = async (method, url, { jar = {}, data } = {}) => {
    const response = await axios({
        method,
        url: `${baseURL}${url}`,
        data,
        validateStatus: () => true,
        headers: Object.keys(jar).length ? { Cookie: cookieHeader(jar) } : undefined,
    });
    return {
        response,
        jar: mergeCookies(jar, response.headers['set-cookie']),
    };
};

test.before(async () => {
    await startMongo();
    await startServer();
});

test.after(async () => {
    await stopServer();
    await stopMongo();
});

test.beforeEach(async () => {
    await User.deleteMany({});
    await Session.deleteMany({});
});

test('signup creates cookies, session, and allows protected me route', async () => {
    const signup = await request('post', '/auth/signup', {
        data: { name: 'Ada Lovelace', email: 'ada@example.com', password: 'password123' },
    });

    assert.equal(signup.response.status, 201);
    assert.equal(signup.response.data.success, true);
    assert.ok(signup.jar.accessToken);
    assert.ok(signup.jar.refreshToken);

    const sessions = await Session.find({}).lean();
    assert.equal(sessions.length, 1);
    assert.equal(sessions[0].revokedAt, null);

    const me = await request('get', '/auth/me', { jar: signup.jar });
    assert.equal(me.response.status, 200);
    assert.equal(me.response.data.user.email, 'ada@example.com');
    assert.equal(me.response.data.activeSessions, 1);
});

test('login tracks multiple sessions and refresh rotates refresh token', async () => {
    await request('post', '/auth/signup', {
        data: { name: 'Grace Hopper', email: 'grace@example.com', password: 'password123' },
    });

    const loginOne = await request('post', '/auth/login', {
        data: { email: 'grace@example.com', password: 'password123' },
    });
    const loginTwo = await request('post', '/auth/login', {
        data: { email: 'grace@example.com', password: 'password123' },
    });

    assert.equal(loginOne.response.status, 200);
    assert.equal(loginTwo.response.status, 200);

    const me = await request('get', '/auth/me', { jar: loginTwo.jar });
    assert.equal(me.response.status, 200);
    assert.equal(me.response.data.activeSessions, 3);

    const oldRefreshToken = loginTwo.jar.refreshToken;
    const refreshed = await request('post', '/auth/refresh', { jar: loginTwo.jar });
    assert.equal(refreshed.response.status, 200);
    assert.ok(refreshed.jar.accessToken);
    assert.notEqual(refreshed.jar.refreshToken, oldRefreshToken);

    const meAfterRefresh = await request('get', '/auth/me', { jar: refreshed.jar });
    assert.equal(meAfterRefresh.response.status, 200);
});

test('reused refresh token is rejected and revokes active sessions', async () => {
    const signup = await request('post', '/auth/signup', {
        data: { name: 'Reuse Tester', email: 'reuse@example.com', password: 'password123' },
    });
    const staleJar = { ...signup.jar };

    const refreshed = await request('post', '/auth/refresh', { jar: signup.jar });
    assert.equal(refreshed.response.status, 200);

    const reused = await request('post', '/auth/refresh', { jar: staleJar });
    assert.equal(reused.response.status, 401);

    const protectedRoute = await request('get', '/auth/me', { jar: refreshed.jar });
    assert.equal(protectedRoute.response.status, 401);

    const activeSessions = await Session.countDocuments({ revokedAt: null });
    assert.equal(activeSessions, 0);
});

test('logout invalidates current session tokens', async () => {
    const signup = await request('post', '/auth/signup', {
        data: { name: 'Logout Tester', email: 'logout@example.com', password: 'password123' },
    });

    const logout = await request('post', '/auth/logout', { jar: signup.jar });
    assert.equal(logout.response.status, 200);

    const me = await request('get', '/auth/me', { jar: signup.jar });
    assert.equal(me.response.status, 401);

    const refresh = await request('post', '/auth/refresh', { jar: signup.jar });
    assert.equal(refresh.response.status, 401);
});
