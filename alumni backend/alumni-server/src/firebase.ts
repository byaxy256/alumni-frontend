// src/firebase.ts - Firebase Admin SDK initialization for backend push notifications
import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

if (!admin.apps.length) {
  try {
    // On Render, read from /etc/secrets/firebase-service-account.json
    // In local dev, fall back to root of backend folder
    let serviceAccountPath = '/etc/secrets/firebase-service-account.json';
    
    if (!fs.existsSync(serviceAccountPath)) {
      // Fallback for local dev
      serviceAccountPath = path.join(__dirname, '..', 'firebase-service-account.json');
    }

    if (!fs.existsSync(serviceAccountPath)) {
      console.warn('Firebase service account not found. Push notifications disabled.');
    } else {
      const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
      
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      
      console.log('Firebase Admin SDK initialized successfully');
    }
  } catch (error) {
    console.error('Failed to initialize Firebase Admin SDK:', error);
  }
}

export default admin;
