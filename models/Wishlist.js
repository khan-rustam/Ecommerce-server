const mongoose = require('mongoose');

const WishlistSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    items: [{
        product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' }
    }]
});

module.exports = mongoose.model('Wishlist', WishlistSchema);