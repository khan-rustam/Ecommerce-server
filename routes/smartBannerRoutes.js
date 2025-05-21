const express = require('express');
const router = express.Router();
const multer = require('multer');
const smartBannerController = require('../controllers/smartBannerController');
const { isAuth, isAdmin } = require('../middleware/authMiddleware');

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits: {
        fileSize: 20 * 1024 * 1024, // 20MB limit
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

// Public routes
router.get('/active', smartBannerController.getActiveSmartBanners);

// Admin routes (protected)
router.get('/', isAuth, isAdmin, smartBannerController.getAllSmartBanners);
router.get('/:id', isAuth, isAdmin, smartBannerController.getSmartBannerById);
router.post('/', isAuth, isAdmin, smartBannerController.createSmartBanner);
router.put('/:id', isAuth, isAdmin, smartBannerController.updateSmartBanner);
router.delete('/:id', isAuth, isAdmin, smartBannerController.deleteSmartBanner);
router.patch('/:id/toggle-active', isAuth, isAdmin, smartBannerController.toggleActive);

// Image upload route
router.post('/upload', isAuth, isAdmin, upload.single('file'), smartBannerController.uploadImage);

module.exports = router;