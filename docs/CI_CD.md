# CI/CD & Automated Testing

QuestXP uses **GitHub Actions** for continuous integration to ensure code quality and security.

## 🚀 Pipeline Overview

Every push to `main` or pull request triggers the following:

### 1. Backend Validation
- **Dependency Audit**: `npm audit` checks for known vulnerabilities in packages.
- **Unit & Integration Tests**: Runs Node.js native test runner (`node --test`) to verify:
  - JWT Authentication & Token Rotation.
  - Session Management.
  - Security Headers (Helmet).
  - Rate Limiting integration.

### 2. Frontend Validation
- **Linting**: ESLint checks for code style and potential bugs.
- **Unit Tests**: Vitest + React Testing Library verify:
  - UI Component rendering.
  - Critical user paths (Smoke tests).
- **Build Verification**: Ensures the project compiles correctly using Vite.

## 🛠️ Local Setup

### Running Backend Tests
```bash
cd backend
npm test
```

### Running Frontend Tests
```bash
cd frontend
npm test
# Or for watch mode
npm run test:watch
```

## 🔒 Security Best Practices
- **Environment Variables**: Secrets like `JWT_SECRET` are managed via GitHub Secrets in the CI pipeline.
- **Automated Scanning**: The `npm audit` step blocks builds if high-severity vulnerabilities are found.
- **Rate Limiting**: Integrated at the application level and verified in tests.
