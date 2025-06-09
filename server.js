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
app.use('/api/banners', require('./routes/bannerRoutes'));
app.use('/api/blogs', require('./routes/blogRoutes'));
app.use('/api/brands', require('./routes/brandRoutes'));
app.use('/api/categories', require('./routes/categoryRoutes'));
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/smart-banners', require('./routes/smartBannerRoutes'));
app.use('/api/cart', require('./routes/cart'));
app.use('/api/wishlist', require('./routes/wishlist'));
app.use('/api/reviews', require('./routes/reviewRoutes'));
app.use('/api/questions', require('./routes/questionRoutes'));

// Enquiry Routes
app.use('/api', require('./routes/enquiryRoutes'));

// Callback Routes
app.use('/api', require('./routes/callbackRoutes'));

app.use('/api/warehouses', require('./routes/warehouseRoutes'));

app.get('/', (req, res) => {
    res.send('API Running');
});

app.listen(PORT, () => console.log(`Server started on port ${PORT}✈️✈️`));