const mongoose = require('mongoose');

const SmartBannerSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    content: {
        type: String,
        trim: true
    },
    image: {
        type: String,
        required: true,
        trim: true
    },
    imagePublicId: {
        type: String,
        trim: true
    },
    url: {
        type: String,
        trim: true
    },
    isActive: {
        type: Boolean,
        default: true
    },
    displayType: {
        type: String,
        enum: ['popup', 'banner', 'sidebar'],
        default: 'popup'
    },
    startDate: {
        type: Date,
        default: Date.now
    },
    endDate: {
        type: Date
    },
    showOnPages: {
        type: [String],
        default: ['home']
    },
    frequency: {
        type: String,
        enum: ['always', 'once', 'daily', 'weekly'],
        default: 'always'
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, { timestamps: true });

module.exports = mongoose.model('SmartBanner', SmartBannerSchema);