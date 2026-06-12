const admin = require('firebase-admin');

try {
    // Requires FIREBASE_SERVICE_ACCOUNT_BASE64 env variable
    // You must base64 encode your firebase admin serviceAccountKey.json
    // e.g. base64 -w 0 serviceAccountKey.json
    if (process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
        const serviceAccount = JSON.parse(
            Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, 'base64').toString('utf-8')
        );

        admin.initializeApp({
            credential: admin.cert(serviceAccount)
        });
        console.log('[FIREBASE] Admin SDK initialized successfully.');
    } else {
        console.warn('[FIREBASE] Missing FIREBASE_SERVICE_ACCOUNT_BASE64. Push notifications will be mocked.');
    }
} catch (error) {
    console.error('[FIREBASE] Error initializing Admin SDK:', error);
}

module.exports = admin;
