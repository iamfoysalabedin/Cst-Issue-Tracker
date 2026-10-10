import express from 'express';
import { createServer as createViteServer } from 'vite';
import { google } from 'googleapis';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(process.cwd(), 'data');
const MODULE_CONFIG_FILE = path.join(DATA_DIR, 'module-config.json');

const DEFAULT_SERVER_MODULE_CONFIG = {
  Dashboard: true,
  Sales: true,
  Retention: true,
  IssueEntry: true,
  IssueReports: true,
  Analytics: true,
  WeeklyReport: true,
  MonthlyEntry: true,
  MonthlyReports: true,
  DowntimeEntry: true,
  DowntimeReports: true,
  NoticeGenerator: true,
  SimFinder: true,
  Settings: true,
};

function readModuleConfigFromFile() {
  try {
    if (fs.existsSync(MODULE_CONFIG_FILE)) {
      const raw = fs.readFileSync(MODULE_CONFIG_FILE, 'utf-8');
      return { ...DEFAULT_SERVER_MODULE_CONFIG, ...JSON.parse(raw) };
    }
  } catch (err) {
    console.error('Error reading module config from file:', err);
  }
  return { ...DEFAULT_SERVER_MODULE_CONFIG };
}

function writeModuleConfigToFile(config: any) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(MODULE_CONFIG_FILE, JSON.stringify(config, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing module config to file:', err);
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Global Module Configuration API (Synchronized across all browsers and devices)
  app.get('/api/admin/module-config', (req, res) => {
    try {
      const config = readModuleConfigFromFile();
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
      res.status(200).json({ success: true, config });
    } catch (error: any) {
      console.error('Error fetching module config:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.post('/api/admin/module-config', (req, res) => {
    try {
      const updatedConfig = { ...DEFAULT_SERVER_MODULE_CONFIG, ...(req.body?.config || req.body) };
      writeModuleConfigToFile(updatedConfig);
      res.status(200).json({ success: true, config: updatedConfig });
    } catch (error: any) {
      console.error('Error saving module config:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Google Sheets API Endpoint to append issue
  app.post('/api/google-sheets/append', async (req, res) => {
    try {
      // UPDATE THIS URL AFTER NEW DEPLOYMENT (OR USE ENV VAR)
      const webappUrl = process.env.GOOGLE_SHEET_WEBAPP_URL || 'https://script.google.com/macros/s/AKfycbxqevYmFg3mzpHh8yUbR5yr-OB22ha4QEUbsVvN6caAVt4spoST9dLyoRq7KlZt7KZN/exec';
      
      const response = await fetch(webappUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(req.body),
      });

      const result = await response.json();
      res.status(200).json(result);
    } catch (error: any) {
      console.error('Google Sheets Error:', error);
      res.status(500).json({ 
        success: false, 
        error: error.message || 'Failed to sync with Google Sheets' 
      });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
