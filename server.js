import express from 'express';
import cors from 'cors';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
const PORT = 3001;

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from public directory
app.use(express.static('public'))// API endpoint to save JSON files
app.post('/api/save/:fileName', async (req, res) => {
  try {
    const { fileName } = req.params;
    const data = req.body;
    
    // Validate fileName to prevent directory traversal
    if (!/^[a-zA-Z0-9_-]+$/.test(fileName)) {
      return res.status(400).json({ error: 'Invalid file name' });
    }
    
    const filePath = path.join(__dirname, 'public', 'data', `${fileName}.json`);
    
    // Write the data to the file
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
    
    console.log(`Successfully updated ${fileName}.json`);
    res.json({ success: true, message: `${fileName}.json updated successfully` });
    
  } catch (error) {
    console.error('Error saving file:', error);
    res.status(500).json({ error: 'Failed to save file', details: error.message });
  }
});

// API endpoint to read JSON files
app.get('/api/data/:fileName', async (req, res) => {
  try {
    const { fileName } = req.params;
    
    // Validate fileName to prevent directory traversal
    if (!/^[a-zA-Z0-9_-]+$/.test(fileName)) {
      return res.status(400).json({ error: 'Invalid file name' });
    }
    
    const filePath = path.join(__dirname, 'public', 'data', `${fileName}.json`);
    
    // Read the file
    const data = await fs.readFile(filePath, 'utf8');
    const jsonData = JSON.parse(data);
    
    res.json(jsonData);
    
  } catch (error) {
    console.error('Error reading file:', error);
    res.status(500).json({ error: 'Failed to read file', details: error.message });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'Server is running', port: PORT });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`API endpoints:`);
  console.log(`  POST /api/save/:fileName - Save JSON file`);
  console.log(`  GET /api/data/:fileName - Read JSON file`);
  console.log(`  GET /api/health - Health check`);
});