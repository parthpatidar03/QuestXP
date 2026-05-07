importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

firebase.initializeApp({
    projectId: "questxp-52faf",
    messagingSenderId: "371903063687",
    appId: "1:371903063687:web:25e094945096c294163a22"
});

const messaging = firebase.messaging();

// Firebase automatically shows push notifications when the payload has the `notification` object.
// We only need to handle the click event to focus the tab.

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    
    // Default to origin if no custom URL
    const urlToOpen = event.notification.data?.url || self.location.origin;

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
            for (let i = 0; i < windowClients.length; i++) {
                const client = windowClients[i];
                if (client.url.includes(urlToOpen) && 'focus' in client) {
                    return client.focus();
                }
            }
            if (clients.openWindow) {
                return clients.openWindow(urlToOpen);
            }
        })
    );
});
