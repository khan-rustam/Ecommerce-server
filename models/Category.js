const mongoose = require('mongoose');
const slugify = require('slugify');

const CategorySchema = new mongoose.Schema({
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
    parent: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        default: null
    },
    image: {
        type: String,
        default: ''
    },
    imagePublicId: {
        type: String,
        default: ''
    },
    isHidden: {
        type: Boolean,
        default: false
    },
    isPopular: {
        type: Boolean,
        default: false
    },
    brandsCount: {
        type: Number,
        default: 0
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
CategorySchema.pre('save', function(next) {
    if (this.isModified('name')) {
        this.slug = slugify(this.name, { lower: true, strict: true });
    }
    next();
});

module.exports = mongoose.model('Category', CategorySchema);