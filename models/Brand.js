const mongoose = require('mongoose');
const slugify = require('slugify');

const BrandSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        unique: true
    },
    slug: {
        type: String,
        unique: true,
        lowercase: true
    },
    description: {
        type: String,
        trim: true
    },
    category: {
        type: String,
        trim: true
    },
    logo: {
        type: String,
        default: ''
    },
    logoPublicId: {
        type: String,
        default: ''
    },
    isHidden: {
        type: Boolean,
        default: false
    },
    productsCount: {
        type: Number,
        default: 0
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, { timestamps: true });

// Create slug from name before saving
BrandSchema.pre('save', function(next) {
    if (this.isModified('name')) {
        this.slug = slugify(this.name, { lower: true, strict: true });
    }
    next();
});

module.exports = mongoose.model('Brand', BrandSchema);