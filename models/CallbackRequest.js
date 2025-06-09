const mongoose = require('mongoose');

const CallbackRequestSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String },
    phone: { type: String, required: true },
    timing: { type: String, default: 'Anytime' },
    message: { type: String },
    createdAt: { type: Date, default: Date.now },
});

const CallbackRequest = mongoose.model('CallbackRequest', CallbackRequestSchema);

module.exports = CallbackRequest;