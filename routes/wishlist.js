const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Wishlist = require('../models/Wishlist');

// Get wishlist for user
router.get('/', auth, async(req, res) => {
    const userId = req.query.userId || req.user._id;
    const wishlist = await Wishlist.findOne({ userId }).populate('items.product');
    res.json(wishlist || { items: [] });
});

// Save/update wishlist for user
router.post('/', auth, async(req, res) => {
    const { userId, items } = req.body;
    await Wishlist.findOneAndUpdate({ userId }, { items }, { upsert: true });
    res.json({ success: true });
});

// Merge local wishlist with backend wishlist on login
router.post('/merge', auth, async(req, res) => {
    const { userId, items } = req.body;
    let wishlist = await Wishlist.findOne({ userId });
    if (!wishlist) {
        wishlist = new Wishlist({ userId, items });
    } else {
        // Merge logic: add new items if not present
        items.forEach(localItem => {
            const exists = wishlist.items.some(
                item => item.product.toString() === localItem.product.toString()
            );
            if (!exists) {
                wishlist.items.push(localItem);
            }
        });
    }
    await wishlist.save();
    res.json({ success: true });
});

module.exports = router;