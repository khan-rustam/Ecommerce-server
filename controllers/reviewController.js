const Review = require('../models/Review');

// User submits a review
exports.submitReview = async(req, res) => {
    try {
        const { product, user, userName, rating, comment } = req.body;
        if (!product || !user || !userName || !rating || !comment) {
            return res.status(400).json({ message: 'All fields are required.' });
        }
        const review = await Review.create({ product, user, userName, rating, comment });
        res.status(201).json(review);
    } catch (err) {
        res.status(500).json({ message: 'Failed to submit review', error: err.message });
    }
};

// Get approved reviews for a product
exports.getProductReviews = async(req, res) => {
    try {
        const { productId } = req.params;
        const reviews = await Review.find({ product: productId, status: 'approved' }).sort({ createdAt: -1 });
        res.json(reviews);
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch reviews', error: err.message });
    }
};

// Admin: get all reviews
exports.getAllReviews = async(req, res) => {
    try {
        const reviews = await Review.find().populate('product', 'name').populate('user', 'name');
        res.json(reviews);
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch reviews', error: err.message });
    }
};

// Admin: approve review
exports.approveReview = async(req, res) => {
    try {
        const { id } = req.params;
        const review = await Review.findByIdAndUpdate(id, { status: 'approved' }, { new: true });
        res.json(review);
    } catch (err) {
        res.status(500).json({ message: 'Failed to approve review', error: err.message });
    }
};

// Admin: toggle review custom store status
exports.toggleCustomStore = async(req, res) => {
    try {
        const { id } = req.params;
        const review = await Review.findById(id);
        if (!review) {
            return res.status(404).json({ message: 'Review not found' });
        }
        review.isCustomStore = !review.isCustomStore;
        await review.save();
        res.json(review);
    } catch (err) {
        res.status(500).json({ message: 'Failed to toggle custom store status', error: err.message });
    }
};

// Get approved reviews for customer stories (home page)
exports.getCustomerStories = async(req, res) => {
    try {
        const reviews = await Review.find({ status: 'approved', isCustomStore: true }).sort({ createdAt: -1 }).populate('user', 'name');
        res.json(reviews);
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch customer stories', error: err.message });
    }
};

// Admin: delete review
exports.deleteReview = async(req, res) => {
    try {
        const { id } = req.params;
        await Review.findByIdAndDelete(id);
        res.json({ message: 'Review deleted' });
    } catch (err) {
        res.status(500).json({ message: 'Failed to delete review', error: err.message });
    }
};