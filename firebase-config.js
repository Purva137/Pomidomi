/**
 * Firebase Cloud Sync - Placeholder
 * Set firebaseConfig to enable sync. Leave empty to use localStorage only.
 * Syncs: XP, Level, Sessions, Streak, Chick Name
 * Offline: falls back to localStorage. Does not break service worker.
 */
(function () {
    'use strict';
    window.FIREBASE_CONFIG = {
        /* Uncomment and fill to enable Firebase sync:
        apiKey: 'YOUR_API_KEY',
        authDomain: 'YOUR_PROJECT.firebaseapp.com',
        projectId: 'YOUR_PROJECT_ID',
        storageBucket: 'YOUR_PROJECT.appspot.com',
        messagingSenderId: 'YOUR_SENDER_ID',
        appId: 'YOUR_APP_ID'
        */
    };

    window.isFirebaseConfigured = function () {
        var c = window.FIREBASE_CONFIG || {};
        return !!(c.apiKey && c.projectId);
    };

    /* Placeholder: sync to cloud. Override when Firebase is configured. */
    window.syncToCloud = function (data) {
        if (!window.isFirebaseConfigured()) return;
        /* TODO: Firebase Firestore/RealtimeDB write */
    };

    /* Placeholder: sync from cloud. Override when Firebase is configured. */
    window.syncFromCloud = function (callback) {
        if (!window.isFirebaseConfigured()) {
            if (callback) callback(null);
            return;
        }
        /* TODO: Firebase read, then callback(cloudData) */
        if (callback) callback(null);
    };
})();
