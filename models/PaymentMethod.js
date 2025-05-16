const mongoose = require('mongoose');

const PaymentMethodSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, required: true },
    last4: { type: String, required: true },
    expiry: { type: String, required: true },
    cardToken: { type: String, required: true }, // placeholder for real token from payment provider
}, { timestamps: true });

module.exports = mongoose.model('PaymentMethod', PaymentMethodSchema);