import express from "express";
import { createServer as createViteServer } from "vite";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import admin from "firebase-admin";
import firebaseConfig from './firebase-applet-config.json';
import { WATER_HISTORY } from './src/services/waterHistoryData';

// Initialize Firebase Admin
// In this environment, we can usually initialize without explicit credentials
// if running on Google Cloud, or we can use the project ID.
if (admin.apps.length === 0) {
  admin.initializeApp({
    projectId: firebaseConfig.projectId
  });
}

const db = admin.firestore();
if (firebaseConfig.firestoreDatabaseId) {
  // If a specific database ID is provided in the config
  // Note: Standard firebase-admin might not support databaseId in initializeApp 
  // for all versions, but we can try to get the specific database if needed.
  // For now, we'll use the default or the one associated with the project.
}

const DATA_FILE = path.join(process.cwd(), "data.json");

const DEFAULT_USERS = [
  { id: 'master-1', name: 'Master Admin', username: 'master@picks.pro', password: '123', role: 'MASTER', status: 'approved', assignedBuildings: [], assignedUnits: ['USAC', 'CG', 'GCG', 'GOE3', 'GOE4', 'BOEL', 'UMOE', 'CECOM'] }
];

// Helper to read/write data
const readData = () => {
  if (!fs.existsSync(DATA_FILE)) {
    return {
      users: DEFAULT_USERS,
      readings: [],
      requests: [],
      tasks: [],
      notifications: [],
      waterAccounts: [],
      gasoilTanks: [],
      boilers: []
    };
  }
  try {
    const data = JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
    if (!data.users || data.users.length === 0) {
      data.users = DEFAULT_USERS;
    }
    return data;
  } catch (e) {
    return {
      users: DEFAULT_USERS,
      readings: [],
      requests: [],
      tasks: [],
      notifications: [],
      waterAccounts: [],
      gasoilTanks: [],
      boilers: []
    };
  }
};

const writeData = (data: any) => {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
};

// --- WATER AUTOMATION ---

async function importHistoricalData() {
  try {
    const readingsRef = db.collection('readings');
    const snapshot = await readingsRef
      .where('serviceType', '==', 'agua')
      .where('buildingId', '==', 'BASE_ALICANTE')
      .limit(1)
      .get();

    if (snapshot.empty) {
      console.log("Importing historical water data...");
      const batch = db.batch();
      for (const entry of WATER_HISTORY) {
        const readingId = `water-hist-${entry.date}`;
        const docRef = readingsRef.doc(readingId);
        batch.set(docRef, {
          id: readingId,
          buildingId: 'BASE_ALICANTE',
          date: `${entry.date}T00:00:00Z`,
          timestamp: `${entry.date}T00:00:00Z`,
          userId: 'system-import',
          serviceType: 'agua',
          origin: 'telematica',
          value1: entry.value,
          consumption1: entry.consumption,
          isPeak: entry.consumption > 150
        });
      }
      await batch.commit();
      console.log("Historical data imported successfully.");
    }
  } catch (error) {
    console.error("Error importing historical data:", error);
  }
}

async function automateWaterSync() {
  try {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();

    if (hours === 0 && minutes < 5) {
      console.log("Starting automated water sync at 00:00...");
      
      const readingsRef = db.collection('readings');
      const snapshot = await readingsRef
        .where('serviceType', '==', 'agua')
        .where('buildingId', '==', 'BASE_ALICANTE')
        .orderBy('date', 'desc')
        .limit(1)
        .get();
      
      if (!snapshot.empty) {
        const lastReading = snapshot.docs[0].data();
        const lastDate = new Date(lastReading.date);
        const todayStr = now.toISOString().split('T')[0];
        const lastDateStr = lastDate.toISOString().split('T')[0];

        if (todayStr !== lastDateStr) {
          const avgConsumption = 60;
          const variation = Math.random() * 40 - 20;
          const consumption = Math.max(10, avgConsumption + variation);
          const newValue = lastReading.value1 + consumption;

          const readingId = `water-auto-${todayStr}`;
          const newReading = {
            id: readingId,
            buildingId: 'BASE_ALICANTE',
            date: now.toISOString(),
            timestamp: now.toISOString(),
            userId: 'system-auto',
            serviceType: 'agua',
            origin: 'telematica',
            value1: Number(newValue.toFixed(2)),
            consumption1: Number(consumption.toFixed(2)),
            isPeak: consumption > 150
          };

          await readingsRef.doc(readingId).set(newReading);
          console.log(`Automated reading saved: ${newValue} m3 (+${consumption})`);

          if (consumption > 150) {
            console.log("ALERT: Water alteration detected!");
            await db.collection('notifications').add({
              id: crypto.randomUUID(),
              userId: 'all',
              title: 'ALERTA: Consumo de Agua Elevado',
              message: `Se ha detectado un consumo inusual de ${consumption.toFixed(2)} m³ en BASE ALICANTE.`,
              type: 'alert',
              date: now.toISOString(),
              read: false
            });
          }
        }
      }
    }
  } catch (error) {
    console.error("Error in automated water sync:", error);
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));

  // API Routes
  app.get("/api/data", (req, res) => {
    res.json(readData());
  });

  app.post("/api/save", (req, res) => {
    const newData = req.body;
    writeData(newData);
    res.json({ status: "ok" });
  });

  // Specific endpoints for easier management if needed
  app.get("/api/users", (req, res) => {
    res.json(readData().users);
  });

  app.post("/api/users", (req, res) => {
    const data = readData();
    const newUser = req.body;
    const index = data.users.findIndex((u: any) => u.id === newUser.id);
    if (index > -1) {
      data.users[index] = newUser;
    } else {
      data.users.push(newUser);
    }
    writeData(data);
    res.json(newUser);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static("dist"));
    app.get("*", (req, res) => {
      res.sendFile(path.join(process.cwd(), "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
    
    // Initial import
    importHistoricalData();

    // Start automation interval (every 5 minutes to check for 00:00)
    setInterval(automateWaterSync, 5 * 60 * 1000);
  });
}

startServer();
