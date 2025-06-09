const mongoose = require('mongoose');

const warehouseSchema = new mongoose.Schema({
    name: { type: String, required: true },
    address: { type: String, required: true },
    coordinates: {
        lat: { type: Number, required: true },
        lng: { type: Number, required: true }
    },
    rangeInKm: { type: Number, required: true, default: 100 },
    deliveryTime: { type: String, default: '' },
    deliveryCost: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Warehouse', warehouseSchema);