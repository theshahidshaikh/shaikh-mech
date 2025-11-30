
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import bodyParser from 'body-parser';
import path from 'path';
import { fileURLToPath } from 'url';

// Import Models
import { Item, Client, User, Settings } from './models.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Serve Static files from the React app (dist folder)
// Assuming server.js is in /backend and build is in /dist (root)
app.use(express.static(path.join(__dirname, '../dist')));

// MongoDB Connection
// IMPORTANT: Replace <db_password> with your actual database user password
const dbURI = 'mongodb+srv://shahidshaikh_db_user:<db_password>@shaikhmechc1.kxwe07v.mongodb.net/?appName=ShaikhMechC1';

if (dbURI.includes('<db_password>')) {
  console.error('\n\x1b[31m%s\x1b[0m\n', 'ERROR: You must replace <db_password> in backend/server.js with your actual MongoDB password!');
}

mongoose.connect(dbURI)
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.log('MongoDB Connection Error:', err));

// --- API ROUTES ---

// 1. Auth & Settings
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, companyName, address, gstNo } = req.body;
    // In production, hash password here using bcrypt
    const newUser = new User({ email, password, companyName });
    await newUser.save();

    // Create default settings for this company
    const newSettings = new Settings({
        companyName,
        companyAddress: address,
        gstNo,
        defaultRate: 6,
        boreRate: 50,
        currency: ''
    });
    await newSettings.save();

    res.json({ user: newUser, settings: newSettings });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
    // Simplified Login for Demo
    try {
        const user = await User.findOne({ email: req.body.email });
        if(!user) return res.status(404).json({error: "User not found"});
        
        // Simple password check (In production use bcrypt.compare)
        if (user.password !== req.body.password) {
             return res.status(401).json({ error: "Invalid credentials" });
        }
        
        const settings = await Settings.findOne({ companyName: user.companyName });
        res.json({ user, settings });
    } catch(err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/settings', async (req, res) => {
    try {
        const updated = await Settings.findOneAndUpdate({}, req.body, { new: true, upsert: true });
        res.json(updated);
    } catch(err) {
        res.status(500).json({error: err.message});
    }
});

// 2. Items
app.get('/api/items', async (req, res) => {
  try {
    const items = await Item.find().sort({ date: -1 });
    res.json(items);
  } catch(err) {
    res.status(500).json({error: err.message});
  }
});

app.post('/api/items', async (req, res) => {
  try {
    const newItem = new Item(req.body);
    await newItem.save();
    res.json(newItem);
  } catch(err) {
    res.status(500).json({error: err.message});
  }
});

app.put('/api/items/:id', async (req, res) => {
    try {
        // Use findOneAndUpdate with the custom 'id' field, not _id
        const updatedItem = await Item.findOneAndUpdate({ id: req.params.id }, req.body, { new: true });
        res.json(updatedItem);
    } catch(err) {
        res.status(500).json({error: err.message});
    }
});

app.delete('/api/items/:id', async (req, res) => {
  try {
    await Item.findOneAndDelete({ id: req.params.id });
    res.json({ success: true });
  } catch(err) {
    res.status(500).json({error: err.message});
  }
});

// 3. Clients
app.get('/api/clients', async (req, res) => {
  try {
    const clients = await Client.find();
    res.json(clients);
  } catch(err) {
    res.status(500).json({error: err.message});
  }
});

app.post('/api/clients', async (req, res) => {
  try {
    const newClient = new Client(req.body);
    await newClient.save();
    res.json(newClient);
  } catch(err) {
    res.status(500).json({error: err.message});
  }
});

app.put('/api/clients/:id', async (req, res) => {
  try {
      const updatedClient = await Client.findOneAndUpdate({ id: req.params.id }, req.body, { new: true });
      res.json(updatedClient);
  } catch(err) {
      res.status(500).json({error: err.message});
  }
});

app.delete('/api/clients/:id', async (req, res) => {
  try {
    await Client.findOneAndDelete({ id: req.params.id });
    res.json({ success: true });
  } catch(err) {
    res.status(500).json({error: err.message});
  }
});

// --- CATCH ALL ROUTE FOR SPA ---
// The "catchall" handler: for any request that doesn't
// match one above, send back React's index.html file.
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

// Listen on 0.0.0.0 to be accessible from other devices (mobile)
app.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT}`));
