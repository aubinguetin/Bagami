import * as admin from 'firebase-admin';

if (!admin.apps.length) {
    const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

    if (projectId && clientEmail && privateKey) {
        admin.initializeApp({
            credential: admin.credential.cert({
                projectId,
                clientEmail,
                privateKey,
            }),
            // Constructing default database URL
            databaseURL: `https://${projectId}-default-rtdb.firebaseio.com`
        });
    } else {
        console.warn('Firebase Admin not initialized: Missing credentials');
    }
}

export const db = admin.apps.length ? admin.database() : null;
export const messaging = admin.apps.length ? admin.messaging() : null;
