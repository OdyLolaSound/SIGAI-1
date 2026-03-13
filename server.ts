import express from "express";
import { createServer as createViteServer } from "vite";
import fs from "fs";
import path from "path";

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
  });
}

startServer();
