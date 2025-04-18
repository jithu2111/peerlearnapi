const express = require('express');
const session = require('express-session');
const cors = require('cors');
const app = express();
const authRoutes = require('./routes/auth');
const db = require('./config/db');

global.db = db;

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);

const PORT = process.env.PORT || 9001;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
