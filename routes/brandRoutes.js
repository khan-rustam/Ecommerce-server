const express = require('express');
const router = express.Router();
const multer = require('multer');
const brandController = require('../controllers/brandController');
const { isAuth, isAdmin } = require('../middleware/authMiddleware');

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits: {
        fileSize: 1 * 1024 * 1024, // 1MB limit
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
router.get('/', brandController.getAllBrands);
router.get('/id/:id', brandController.getBrandById);
router.get('/slug/:slug', brandController.getBrandBySlug);

// Admin routes (protected)
router.post('/', isAuth, isAdmin, brandController.createBrand);
router.put('/:id', isAuth, isAdmin, brandController.updateBrand);
router.delete('/:id', isAuth, isAdmin, brandController.deleteBrand);
router.patch('/:id/toggle', isAuth, isAdmin, brandController.toggleVisibility);

// Logo upload routes
router.post('/upload', isAuth, isAdmin, upload.single('file'), brandController.uploadLogo);
router.post('/:id/logo', isAuth, isAdmin, upload.single('file'), brandController.updateLogo);

module.exports = router;