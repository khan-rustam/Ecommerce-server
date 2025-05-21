const mongoose = require('mongoose');

const BlogSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    content: {
        type: String,
        required: true
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
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    isPublished: {
        type: Boolean,
        default: false
    },
    slug: {
        type: String,
        unique: true,
        trim: true
    },
    tags: {
        type: [String],
        default: []
    },
    views: {
        type: Number,
        default: 0
    }
}, { timestamps: true });

// Create a slug from the title before saving
BlogSchema.pre('save', function(next) {
    if (this.isModified('title') || !this.slug) {
        this.slug = this.title
            .toLowerCase()
            .replace(/[^a-zA-Z0-9 ]/g, '')
            .replace(/\s+/g, '-');
    }
    next();
});

module.exports = mongoose.model('Blog', BlogSchema);