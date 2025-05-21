const express = require('express');
const router = express.Router();
const multer = require('multer');
const categoryController = require('../controllers/categoryController');
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
router.get('/', categoryController.getAllCategories);
router.get('/popular', categoryController.getPopularCategories);
router.get('/id/:id', categoryController.getCategoryById);
router.get('/slug/:slug', categoryController.getCategoryBySlug);

// Admin routes (protected)
router.post('/', isAuth, isAdmin, categoryController.createCategory);
router.put('/:id', isAuth, isAdmin, categoryController.updateCategory);
router.delete('/:id', isAuth, isAdmin, categoryController.deleteCategory);
router.patch('/:id/toggle-visibility', isAuth, isAdmin, categoryController.toggleVisibility);
router.patch('/:id/toggle-popularity', isAuth, isAdmin, categoryController.togglePopularity);

// Image upload route
router.post('/upload', isAuth, isAdmin, upload.single('file'), categoryController.uploadImage);

module.exports = router;