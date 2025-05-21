const express = require('express');
const router = express.Router();
const multer = require('multer');
const productController = require('../controllers/productController');
const { isAuth, isAdmin } = require('../middleware/authMiddleware');

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits: {
        fileSize: 20 * 1024 * 1024, // 20MB limit
    },
    fileFilter: (req, file, cb) => {
        // Accept only jpg, jpeg, and png
        if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png' || file.mimetype === 'image/jpg') {
            cb(null, true);
        } else {
            cb(new Error('Only JPEG, JPG and PNG files are allowed'), false);
        }
    }
});

// Handle multer errors
const handleUploadErrors = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(413).json({
                message: 'File is too large. Maximum size is 20MB.'
            });
        }
        return res.status(400).json({
            message: `Upload error: ${err.message}`
        });
    } else if (err) {
        return res.status(400).json({
            message: err.message || 'File upload failed'
        });
    }
    next();
};

// Public routes
router.get('/', productController.getAllProducts);
router.get('/category/:slug', productController.getProductsByCategory);
router.get('/slug/:slug', productController.getProductBySlug);

// Admin routes
router.get('/admin', isAuth, isAdmin, productController.getAllProductsAdmin);
router.post('/', isAuth, isAdmin, productController.createProduct);
router.put('/:id', isAuth, isAdmin, productController.updateProduct);
router.delete('/:id', isAuth, isAdmin, productController.deleteProduct);

// Toggle routes
router.patch('/:id/toggle-visibility', isAuth, isAdmin, productController.toggleProductVisibility);
router.patch('/:id/toggle-featured', isAuth, isAdmin, productController.toggleFeatured);
router.patch('/:id/toggle-trending', isAuth, isAdmin, productController.toggleTrending);

// Image upload route
router.post('/upload', isAuth, isAdmin, upload.single('file'), handleUploadErrors, productController.uploadProductImage);

module.exports = router;