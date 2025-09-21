# Quizlet Vocabulary App - JSON File Update Setup

This setup allows the app to update existing JSON files in place instead of downloading new ones.

## Quick Fix for ES Module Error

If you're getting an ES module error, the server has been updated to use ES module syntax. Follow the setup below.

## Setup Instructions

### Option 1: Automatic Setup (Windows)
```bash
# Install server dependencies first
install-server.bat

# Then start everything
start.bat
```

### Option 2: Manual Setup

#### 1. Install Server Dependencies
```bash
# Install express and cors directly
npm install express cors nodemon
```

#### 2. Start the Backend Server
```bash
node server.js
```
Server will run on `http://localhost:3001`

#### 3. Start the React App (in another terminal)
```bash
npm run dev
```
React app will run on `http://localhost:5173`

## How It Works

### API Endpoints
- `POST /api/save/:fileName` - Updates existing JSON files
- `GET /api/data/:fileName` - Reads JSON files
- `GET /api/health` - Server health check

### File Updates
1. **Edit/Add/Delete** words in the app
2. **Changes save automatically** to existing JSON files
3. **No manual file replacement** needed
4. **Refresh browser** to see persisted changes

### Fallback System
- If server is not running, app falls back to download mode
- If API fails, app loads from static files in `/public/data/`

## File Structure
```
quizlet/
??? src/
?   ??? App.tsx          # React app with API integration
?   ??? App.css          # Styles
??? public/
?   ??? data/            # JSON vocabulary files
?       ??? lesson1.json
?       ??? lesson2.json
?       ??? animals.json
?       ??? colors.json
?       ??? numbers.json
??? server.js            # Express server (ES modules)
??? server-package.json  # Server dependencies
??? install-server.bat   # Install server dependencies
??? start.bat           # Windows startup script
```

## Benefits
- ? **Direct file updates** - No manual file replacement
- ? **Automatic persistence** - Changes saved immediately
- ? **Fallback support** - Works even if server is offline
- ? **Development friendly** - Easy to set up and use
- ? **No data loss** - Existing files are updated in place

## Troubleshooting

### ES Module Error
The server now uses ES module syntax (import/export). Make sure you have Node.js 14+ installed.

### Port Already in Use
If port 3001 is busy, edit `server.js` and change the PORT variable.

### Dependencies Missing
Run `install-server.bat` or manually install: `npm install express cors nodemon`

### CORS Issues
The server includes CORS middleware to allow requests from the React app.

### File Permissions
Make sure the server has write permissions to the `public/data/` directory.

## Production Deployment
For production, consider:
- Using a proper database instead of JSON files
- Adding authentication and authorization
- Using environment variables for configuration
- Adding input validation and sanitization

## Testing the Setup

1. Start the server: `node server.js`
2. Check if it's running: Visit `http://localhost:3001/api/health`
3. Start React app: `npm run dev`
4. Test editing words in the app
5. Check if JSON files in `public/data/` are updated