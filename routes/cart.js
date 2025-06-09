const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Cart = require('../models/Cart');

// Get cart for user
router.get('/', auth, async(req, res) => {
    const userId = req.query.userId || req.user._id;
    const cart = await Cart.findOne({ userId }).populate('items.product');
    res.json(cart || { items: [] });
});

// Save/update cart for user
router.post('/', auth, async(req, res) => {
    const { userId, items } = req.body;
    await Cart.findOneAndUpdate({ userId }, { items }, { upsert: true });
    res.json({ success: true });
});

// Merge local cart with backend cart on login
router.post('/merge', auth, async(req, res) => {
    const { userId, items } = req.body;
    let cart = await Cart.findOne({ userId });
    if (!cart) {
        cart = new Cart({ userId, items });
    } else {
        // Merge logic: add new items or update quantities
        items.forEach(localItem => {
            const existing = cart.items.find(
                item => item.product.toString() === localItem.product.toString()
            );
            if (existing) {
                existing.quantity += localItem.quantity;
            } else {
                cart.items.push(localItem);
            }
        });
    }
    await cart.save();
    res.json({ success: true });
});

module.exports = router;