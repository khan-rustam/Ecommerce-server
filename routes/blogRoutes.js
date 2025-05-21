const express = require('express');
const router = express.Router();
const multer = require('multer');
const blogController = require('../controllers/blogController');
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
router.get('/public', blogController.getAllBlogs);
router.get('/:identifier', blogController.getBlogByIdOrSlug);

// Protected routes (authenticated users)
router.get('/', isAuth, isAdmin, blogController.getAllBlogsAdmin);
router.post('/', isAuth, blogController.createBlog);
router.put('/:id', isAuth, blogController.updateBlog);
router.delete('/:id', isAuth, blogController.deleteBlog);
router.patch('/:id/toggle-published', isAuth, blogController.togglePublished);

// Image upload route with error handling
router.post('/upload', isAuth, upload.single('file'), handleUploadErrors, blogController.uploadImage);

module.exports = router;