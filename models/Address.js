const mongoose = require('mongoose');

const AddressSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    addressLine1: { type: String, required: true },
    city: { type: String, required: true },
    country: { type: String, required: true },
    pincode: { type: String, required: true },
    landmark: { type: String },
    phone: { type: String, required: true },
}, { timestamps: true });

module.exports = mongoose.model('Address', AddressSchema);