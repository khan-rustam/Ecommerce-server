const mongoose = require('mongoose');

const BrandSettingsSchema = new mongoose.Schema({
    paletteName: { type: String, required: true },
    primary: { type: String },
    secondary: { type: String },
    accent: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('BrandSettings', BrandSettingsSchema);