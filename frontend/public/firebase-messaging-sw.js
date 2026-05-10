importScripts('https://www.gstatic.com/firebasejs/10.13.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.13.2/firebase-messaging-compat.js');

firebase.initializeApp({
    apiKey: "AIzaSyD1xVn_7Yg9fvis3emserxElqSgYKYBz1I",
    authDomain: "questxp-52faf.firebaseapp.com",
    projectId: "questxp-52faf",
    messagingSenderId: "371903063687",
    appId: "1:371903063687:web:25e094945096c294163a22"
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
    console.log('[SW] Received background message:', payload);
    
    const title = payload.notification?.title || payload.data?.title || 'QuestXP';
    const body = payload.notification?.body || payload.data?.body || 'You have a new update.';
    const url = payload.data?.url || self.location.origin;

    const notificationOptions = {
        body: body,
        icon: '/favicon.png',
        badge: '/favicon.png',
        tag: 'questxp-notification', // Deduplicate notifications
        renotify: true,
        data: { url: url }
    };

    return self.registration.showNotification(title, notificationOptions);
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    
    const urlToOpen = event.notification.data?.url || '/';

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
            // If a tab is already open, focus it
            for (let i = 0; i < windowClients.length; i++) {
                const client = windowClients[i];
                if (client.url.includes(urlToOpen) && 'focus' in client) {
                    return client.focus();
                }
            }
            // Otherwise, open a new window
            if (clients.openWindow) {
                return clients.openWindow(urlToOpen);
            }
        })
    );
});
