const express = require('express');
const router = express.Router();
const multer = require('multer');
const bannerController = require('../controllers/bannerController');
const { isAuth, isAdmin } = require('../middleware/authMiddleware');

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
    },
    fileFilter: (req, file, cb) => {
        // Accept only jpg and png
        if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
            cb(null, true);
        } else {
            cb(new Error('Only JPEG and PNG files are allowed'), false);
        }
    }
});

// Get all banners
router.get('/', bannerController.getAllBanners);

// Get active banners (show = true)
router.get('/active', bannerController.getActiveBanners);

// Upload banner image
router.post('/upload', isAuth, isAdmin, upload.single('file'), bannerController.uploadBanner);

// Admin routes (protected)
router.post('/', isAuth, isAdmin, bannerController.createBanner);
router.patch('/:id/toggle', isAuth, isAdmin, bannerController.toggleBannerVisibility);
router.delete('/:id', isAuth, isAdmin, bannerController.deleteBanner);

module.exports = router;