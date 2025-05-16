require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('express').json;
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(bodyParser());
app.use(cors({
    origin: [
        'http://localhost:5173',
        'https://ecommerce-client-1gsy.vercel.app'
    ],
    credentials: true
}));

// Handle CORS preflight requests for all routes
app.options('*', cors());

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB connected✅✅'))
    .catch((err) => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/admin/brand-settings', require('./routes/brandSettings'));

app.get('/', (req, res) => {
    res.send('API Running');
});

app.listen(PORT, () => console.log(`Server started on port ${PORT}✈️✈️`));