const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');

router.post('/', reviewController.submitReview);
router.get('/product/:productId', reviewController.getProductReviews);
router.get('/', reviewController.getAllReviews);
router.patch('/:id/approve', reviewController.approveReview);
router.patch('/:id/custom-store', reviewController.toggleCustomStore);
router.delete('/:id', reviewController.deleteReview);
router.get('/customer-stories', reviewController.getCustomerStories);

module.exports = router;