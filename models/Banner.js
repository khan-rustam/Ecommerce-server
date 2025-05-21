const mongoose = require('mongoose');

const bannerSchema = new mongoose.Schema({
    path: {
        type: String,
        required: true,
        trim: true,
    },
    name: {
        type: String,
        trim: true,
        default: 'Unnamed Banner'
    },
    show: {
        type: Boolean,
        default: true,
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
}, { timestamps: true });

module.exports = mongoose.model('Banner', bannerSchema);