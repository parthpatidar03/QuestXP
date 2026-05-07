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

try {
    if (firebaseConfig.apiKey) {
        const app = initializeApp(firebaseConfig);
        messaging = getMessaging(app);
    } else {
        console.warn('[Firebase] Config missing. Push notifications disabled.');
    }
} catch (error) {
    console.error('[Firebase] Initialization error:', error);
}

export const requestNotificationPermission = async () => {
    if (!messaging) return null;
    try {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
            // USER: Add your VAPID key here
            const token = await getToken(messaging, { 
                vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY 
            });
            
            if (token) {
                // Send token to our backend
                await api.post('/notifications/register', {
                    fcmToken: token,
                    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
                });
                return token;
            }
        }
        return null;
    } catch (error) {
        console.error('[Firebase] Permission error:', error);
        return null;
    }
};

export const onMessageListener = () =>
    new Promise((resolve) => {
        if (!messaging) return;
        onMessage(messaging, (payload) => {
            resolve(payload);
        });
    });

export default messaging;
