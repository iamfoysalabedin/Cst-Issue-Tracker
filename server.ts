import express from 'express';
import { createServer as createViteServer } from 'vite';
import { google } from 'googleapis';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Google Sheets API Endpoint to append issue
  app.post('/api/google-sheets/append', async (req, res) => {
    try {
      const webappUrl = process.env.GOOGLE_SHEET_WEBAPP_URL || 'https://script.google.com/macros/s/AKfycbxCB_bSRrMg70OaBJpM--XOPqZayWzwQtJ8gh1tZOscmqwXSmrdJ8YQwwvYXSExAksz/exec';
      
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
