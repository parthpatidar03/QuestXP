import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import api from './api';

// USER: Add your Firebase config here
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID
};

let messaging = null;
let serviceWorkerRegistrationPromise = null;
const MESSAGING_SW_PATH = '/firebase-messaging-sw.js';

try {
    if (typeof window !== 'undefined' && firebaseConfig.apiKey) {
        const app = initializeApp(firebaseConfig);
        messaging = getMessaging(app);
    } else {
        console.warn('[Firebase] Config missing. Push notifications disabled.');
    }
} catch (error) {
    console.error('[Firebase] Initialization error:', error);
}

const registerMessagingServiceWorker = async () => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return null;
    if (!serviceWorkerRegistrationPromise) {
        serviceWorkerRegistrationPromise = navigator.serviceWorker.register(MESSAGING_SW_PATH)
            .then(async (registration) => {
                await navigator.serviceWorker.ready;
                return registration;
            })
            .catch((error) => {
                console.error('[Firebase] Service worker registration failed:', error);
                return null;
            });
    }
    return serviceWorkerRegistrationPromise;
};

export const requestNotificationPermission = async () => {
    if (!messaging || typeof window === 'undefined' || !('Notification' in window)) return null;
    try {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
            const serviceWorkerRegistration = await registerMessagingServiceWorker();
            if (!serviceWorkerRegistration) {
                console.warn('[Firebase] ❌ Service worker unavailable. Push notifications disabled.');
                return null;
            }

            const token = await getToken(messaging, {
                serviceWorkerRegistration,
                vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY 
            });
            
            if (token) {
                // Check if token already registered today to avoid spam
                const storedToken = localStorage.getItem('questxp_fcm_token');
                const storedAt = localStorage.getItem('questxp_fcm_registered_at');
                const now = Date.now();
                const oneDay = 24 * 60 * 60 * 1000;

                if (storedToken === token && storedAt && (now - parseInt(storedAt)) < oneDay) {
                    return token;
                }

                console.log('[Firebase] ✅ Token generated successfully!');
                try {
                    await api.post('/notifications/register', {
                        fcmToken: token,
                        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
                    });
                    localStorage.setItem('questxp_fcm_token', token);
                    localStorage.setItem('questxp_fcm_registered_at', now.toString());
                    console.log('[Firebase] ✅ Token saved to database successfully!');
                } catch (apiErr) {
                    console.error('[Firebase] ❌ Token generated, but failed to save to Database. Are you logged in?', apiErr);
                }
                return token;
            } else {
                console.warn('[Firebase] ❌ Permission granted but no token returned.');
            }
        }
        return null;
    } catch (error) {
        console.error('[Firebase] Permission error:', error);
        return null;
    }
};

export const onMessageListener = (handler) => {
    if (!messaging || typeof handler !== 'function') return () => {};
    return onMessage(messaging, handler);
};

export default messaging;
