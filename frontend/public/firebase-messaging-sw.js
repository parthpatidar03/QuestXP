importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

firebase.initializeApp({
    apiKey: true, // Not strictly needed for SW background
    projectId: "questxp-52faf",
    messagingSenderId: "371903063687",
    appId: "1:371903063687:web:25e094945096c294163a22"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
    console.log('[SW] Background Message:', payload);
    const notificationTitle = payload.notification.title;
    const notificationOptions = {
        body: payload.notification.body,
        icon: '/logo.png' // Adjust if you have a logo
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});
