import express from "express";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import admin from "firebase-admin";
import { getFirestore } from 'firebase-admin/firestore';
import twilio from 'twilio';

// Load Firebase configuration
const firebaseConfigPath = path.join(process.cwd(), 'firebase-applet-config.json');
let firebaseConfig: any = { projectId: 'placeholder' };

if (fs.existsSync(firebaseConfigPath)) {
  try {
    firebaseConfig = JSON.parse(fs.readFileSync(firebaseConfigPath, 'utf8'));
  } catch (e) {
    console.error("Error parsing firebase-applet-config.json:", e);
  }
} else {
  console.warn("firebase-applet-config.json not found. Using placeholder config.");
}

import { WATER_HISTORY } from './src/services/waterHistoryData.js';

// Initialize Firebase Admin
let adminApp: admin.app.App;
if (admin.apps.length === 0) {
  console.log(`Initializing Firebase Admin for project: ${firebaseConfig.projectId}`);
  adminApp = admin.initializeApp({
    projectId: firebaseConfig.projectId
  });
} else {
  adminApp = admin.app();
}

const dbId = firebaseConfig.firestoreDatabaseId || '(default)';
console.log(`Connecting to Firestore database: ${dbId}`);
const db = getFirestore(adminApp, dbId);

const twilioClient = process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN 
  ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
  : null;

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

    // Ensure a default water account exists
    const accountsRef = db.collection('water_accounts');
    const accountsSnapshot = await accountsRef.limit(1).get();
    if (accountsSnapshot.empty) {
      console.log("Creating default water account...");
      await accountsRef.doc('main-water-account').set({
        id: 'main-water-account',
        name: 'Contador General Base Alicante',
        buildingId: 'BASE_ALICANTE',
        webUser: 'USAC_ALICANTE',
        status: 'conectada',
        peakThresholdM3: 150,
        peakThresholdPercent: 50,
        selectors: {
          userField: '#username',
          passField: '#password',
          submitBtn: '#login-btn',
          tableRow: '.consumption-row'
        }
      });
    }

    // Seed Boilers if empty
    const boilersRef = db.collection('boilers');
    const boilersSnapshot = await boilersRef.limit(1).get();
    if (boilersSnapshot.empty) {
      console.log("Seeding default boilers...");
      const defaultBoilers = [
        {
          id: 'E0007',
          buildingId: 'E0007',
          buildingCode: 'E0007',
          buildingName: 'Vestuario de Mandos',
          code: 'CAL-0007',
          brand: 'Roca',
          model: 'P-30',
          powerKw: 45,
          status: 'operativa',
          refTemps: { impulsionMin: 60, impulsionMax: 85, pressureMin: 1.2, pressureMax: 2.5 }
        },
        {
          id: 'E0010',
          buildingId: 'E0010',
          buildingCode: 'E0010',
          buildingName: 'Vestuario GCG y GOE III',
          code: 'CAL-0010',
          brand: 'Ferroli',
          model: 'SFL 3',
          powerKw: 60,
          status: 'operativa',
          refTemps: { impulsionMin: 60, impulsionMax: 80, pressureMin: 1.5, pressureMax: 2.8 }
        }
      ];
      for (const b of defaultBoilers) {
        await boilersRef.doc(b.id).set(b);
      }
    }

    // Seed Gasoil Tanks if empty
    const tanksRef = db.collection('gasoil_tanks');
    const tanksSnapshot = await tanksRef.limit(1).get();
    if (tanksSnapshot.empty) {
      console.log("Seeding default gasoil tanks...");
      const defaultTanks = [
        {
          id: 'tank-1',
          buildingId: 'E0007',
          buildingCode: 'E0007',
          buildingName: 'Vestuario de Mandos',
          tankNumber: 1,
          fullName: 'Depósito Vestuario Mandos',
          totalCapacity: 2000,
          currentLevel: 75,
          currentLitres: 1500,
          alertStatus: 'normal'
        }
      ];
      for (const t of defaultTanks) {
        await tanksRef.doc(t.id).set(t);
      }
    }
    
    // Seed Salt Stock if empty
    const saltRef = db.collection('salt_stock').doc('current');
    const saltDoc = await saltRef.get();
    if (!saltDoc.exists) {
      console.log("Seeding default salt stock...");
      await saltRef.set({
        sacksAvailable: 45,
        kgPerSack: 25,
        minAlertLevel: 20,
        criticalAlertLevel: 10,
        status: 'normal',
        lastSupplier: 'Salinas de Torrevieja'
      });
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

    // Run once a day at 00:00
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
          console.log(`Automated water reading saved: ${newValue} m3 (+${consumption})`);

          if (consumption > 150) {
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

async function automateGasoilTelemetry() {
  try {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();

    // Simulate sensor update every 4 hours
    if (hours % 4 === 0 && minutes < 5) {
      console.log("Updating Gasoil telemetry sensors...");
      const tanksRef = db.collection('gasoil_tanks');
      const snapshot = await tanksRef.get();

      for (const doc of snapshot.docs) {
        const tank = doc.data();
        // Simulate a small daily consumption (0.1% to 0.5% every 4 hours)
        const consumptionPercent = (Math.random() * 0.4 + 0.1);
        const newLevel = Math.max(0, tank.currentLevel - consumptionPercent);
        const newLitres = (newLevel / 100) * tank.totalCapacity;

        let alertStatus = 'normal';
        if (newLevel < 15) alertStatus = 'critico';
        else if (newLevel < 25) alertStatus = 'bajo';
        else if (newLevel < 40) alertStatus = 'atencion';

        await tanksRef.doc(doc.id).update({
          currentLevel: Number(newLevel.toFixed(2)),
          currentLitres: Math.round(newLitres),
          lastReading: now.toISOString(),
          alertStatus
        });

        // Add to readings history
        await db.collection('gasoil_readings').add({
          id: crypto.randomUUID(),
          tankId: doc.id,
          date: now.toISOString(),
          percentage: Number(newLevel.toFixed(2)),
          litres: Math.round(newLitres),
          method: 'sensor',
          userId: 'system-iot'
        });

        if (alertStatus === 'critico' || alertStatus === 'bajo') {
          await db.collection('notifications').add({
            id: crypto.randomUUID(),
            userId: 'all',
            title: `Nivel Bajo: ${tank.fullName}`,
            message: `El depósito ${tank.fullName} está al ${newLevel.toFixed(1)}%. Se recomienda repostaje.`,
            type: 'alert',
            date: now.toISOString(),
            read: false
          });
        }
      }
    }
  } catch (error) {
    console.error("Error in Gasoil telemetry:", error);
  }
}

async function automateBoilerTelemetry() {
  try {
    const now = new Date();
    const minutes = now.getMinutes();

    // Update every 30 minutes
    if (minutes % 30 < 5) {
      console.log("Updating Boiler IoT sensors...");
      const boilersRef = db.collection('boilers');
      const snapshot = await boilersRef.get();

      for (const doc of snapshot.docs) {
        const boiler = doc.data();
        if (boiler.status === 'averiada' || boiler.status === 'fuera_servicio') continue;

        // Simulate normal operating ranges
        const tempImpulsion = boiler.refTemps.impulsionMin + Math.random() * (boiler.refTemps.impulsionMax - boiler.refTemps.impulsionMin);
        const tempRetorno = tempImpulsion - (5 + Math.random() * 10);
        const pressure = boiler.refTemps.pressureMin + Math.random() * (boiler.refTemps.pressureMax - boiler.refTemps.pressureMin);
        
        const alerts = [];
        if (pressure > boiler.refTemps.pressureMax) alerts.push('SOBREPRESIÓN');
        if (pressure < boiler.refTemps.pressureMin) alerts.push('BAJA PRESIÓN');

        await db.collection('boiler_readings').add({
          id: crypto.randomUUID(),
          boilerId: doc.id,
          date: now.toISOString(),
          tempImpulsion: Number(tempImpulsion.toFixed(1)),
          tempRetorno: Number(tempRetorno.toFixed(1)),
          pressure: Number(pressure.toFixed(2)),
          isOn: true,
          userId: 'system-iot',
          userName: 'Sensor IoT Central',
          alerts
        });

        if (alerts.length > 0) {
          await db.collection('notifications').add({
            id: crypto.randomUUID(),
            userId: 'all',
            title: `Alarma Caldera: ${boiler.code}`,
            message: `Detectada anomalía en ${boiler.buildingName}: ${alerts.join(', ')}`,
            type: 'alert',
            date: now.toISOString(),
            read: false
          });
        }
      }
    }
  } catch (error) {
    console.error("Error in Boiler telemetry:", error);
  }
}

async function automateSaltInventory() {
  try {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();

    // Run once a day at 01:00
    if (hours === 1 && minutes < 5) {
      console.log("Updating Salt inventory levels...");
      const stockRef = db.collection('salt_stock').doc('current');
      const doc = await stockRef.get();
      
      if (doc.exists) {
        const stock = doc.data();
        // Simulate consumption: 0.5 to 1.5 sacks per day
        const consumption = 0.5 + Math.random();
        const newSacks = Math.max(0, stock.sacksAvailable - consumption);
        
        let status = 'normal';
        if (newSacks < stock.criticalAlertLevel) status = 'critico';
        else if (newSacks < stock.minAlertLevel) status = 'bajo';

        await stockRef.update({
          sacksAvailable: Number(newSacks.toFixed(1)),
          status
        });

        if (status === 'critico' || status === 'bajo') {
          await db.collection('notifications').add({
            id: crypto.randomUUID(),
            userId: 'all',
            title: 'Stock de Sal Bajo',
            message: `Quedan aproximadamente ${newSacks.toFixed(1)} sacos en el almacén central.`,
            type: 'alert',
            date: now.toISOString(),
            read: false
          });
        }
      }
    }
  } catch (error) {
    console.error("Error in Salt inventory automation:", error);
  }
}

async function checkScheduledWhatsAppNotifications() {
  try {
    const now = new Date().toISOString();
    const tasksRef = db.collection('tasks');
    
    // Query for tasks with enabled notifications that haven't been sent and are due
    const snapshot = await tasksRef
      .where('whatsappNotification.enabled', '==', true)
      .where('whatsappNotification.sent', '==', false)
      .where('whatsappNotification.notifyAt', '<=', now)
      .get();

    if (snapshot.empty) return;

    console.log(`[WHATSAPP] Found ${snapshot.size} notifications to process.`);

    for (const doc of snapshot.docs) {
      const task = doc.data();
      const phone = task.whatsappNotification.phoneNumber;
      
      if (!phone) {
        await tasksRef.doc(doc.id).update({
          'whatsappNotification.sent': true,
          'whatsappNotification.error': 'No phone number provided'
        });
        continue;
      }

      const msg = `🔔 *RECORDATORIO SIGAI USAC*\n━━━━━━━━━━━━━━\n📋 *Tarea:* ${task.title}\n📅 *Fecha:* ${task.startDate}\n⏰ *Hora:* ${task.startTime || 'S/N'}\n🏢 *Ubicación:* ${task.location || 'N/A'}\n📝 *Descripción:* ${task.description}\n━━━━━━━━━━━━━━\n_Este es un aviso automático programado._`;

      if (twilioClient) {
        try {
          await twilioClient.messages.create({
            body: msg,
            from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
            to: `whatsapp:${phone.startsWith('+') ? phone : '+34' + phone}`
          });
          
          await tasksRef.doc(doc.id).update({
            'whatsappNotification.sent': true,
            'whatsappNotification.sentAt': new Date().toISOString()
          });
          console.log(`[WHATSAPP] Sent to ${phone} for task: ${task.title}`);
        } catch (err: any) {
          console.error(`[WHATSAPP] Error sending to ${phone}:`, err.message);
          await tasksRef.doc(doc.id).update({
            'whatsappNotification.error': err.message
          });
        }
      } else {
        console.warn("[WHATSAPP] Twilio not configured. Marking as sent (DEV MODE).");
        await tasksRef.doc(doc.id).update({
          'whatsappNotification.sent': true,
          'whatsappNotification.error': 'Twilio not configured'
        });
      }
    }
  } catch (error) {
    console.error("[WHATSAPP] Error in check loop:", error);
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

  // Vite middleware for development or fallback
  const isProduction = process.env.NODE_ENV === "production";
  const distExists = fs.existsSync(path.join(process.cwd(), "dist"));

  if (isProduction && distExists) {
    console.log("Serving production build from dist/");
    app.use(express.static("dist"));
    app.get("*all", (req, res) => {
      res.sendFile(path.join(process.cwd(), "dist", "index.html"));
    });
  } else {
    console.log("Starting in development mode with Vite middleware...");
    try {
      const { createServer: createViteServer } = await import("vite");
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa",
      });
      app.use(vite.middlewares);
    } catch (e) {
      console.error("Failed to start Vite middleware. If this is production, ensure 'npm run build' was executed.", e);
      app.get("*all", (req, res) => {
        res.status(500).send("Server configuration error: dist/ not found and Vite not available.");
      });
    }
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
    
    // Initial import
    importHistoricalData();

    // Start automation interval (every 5 minutes to check for scheduled tasks)
    setInterval(() => {
      automateWaterSync();
      automateGasoilTelemetry();
      automateBoilerTelemetry();
      automateSaltInventory();
      checkScheduledWhatsAppNotifications();
    }, 5 * 60 * 1000);
  });
}

startServer();
