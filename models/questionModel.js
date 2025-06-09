const mongoose = require('mongoose');

const questionSchema = mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    product: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Product'
    },
    question: {
        type: String,
        required: true
    },
    answer: {
        type: String,
        default: ''
    },
    isApproved: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const Question = mongoose.model('Question', questionSchema);

module.exports = Question;