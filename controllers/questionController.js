const asyncHandler = require('express-async-handler');
const Question = require('../models/questionModel');
const Product = require('../models/Product.js');

// @desc    Submit a question for a product
// @route   POST /api/questions
// @access  Private (User)
const submitQuestion = asyncHandler(async(req, res) => {
    const { productId, question } = req.body;
    const user = req.user;

    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
        res.status(404);
        throw new Error('Product not found');
    }

    // Create new question
    const newQuestion = new Question({
        user: user._id,
        product: productId,
        question: question
    });

    const createdQuestion = await newQuestion.save();

    res.status(201).json(createdQuestion);
});

// @desc    Get approved questions for a product
// @route   GET /api/questions/product/:productId
// @access  Public
const getProductQuestions = asyncHandler(async(req, res) => {
    const productId = req.params.productId;

    const questions = await Question.find({ product: productId, isApproved: true }).populate('user', 'username');

    res.json(questions);
});

// @desc    Get all questions (Admin)
// @route   GET /api/questions
// @access  Private (Admin)
const getAllQuestions = asyncHandler(async(req, res) => {
    const questions = await Question.find({}).populate('user', 'username').populate('product', 'name');
    res.json(questions);
});

// @desc    Answer a question (Admin)
// @route   PUT /api/questions/:id/answer
// @access  Private (Admin)
const answerQuestion = asyncHandler(async(req, res) => {
    const questionId = req.params.id;
    const { answer } = req.body;

    const question = await Question.findById(questionId);

    if (!question) {
        res.status(404);
        throw new Error('Question not found');
    }

    question.answer = answer;
    const updatedQuestion = await question.save();

    res.json(updatedQuestion);
});

// @desc    Approve or unapprove a question (Admin)
// @route   PUT /api/questions/:id/approve
// @access  Private (Admin)
const approveQuestion = asyncHandler(async(req, res) => {
    const questionId = req.params.id;
    const { isApproved } = req.body;

    const question = await Question.findById(questionId);

    if (!question) {
        res.status(404);
        throw new Error('Question not found');
    }

    question.isApproved = isApproved;
    const updatedQuestion = await question.save();

    res.json(updatedQuestion);
});

// @desc    Delete a question (Admin)
// @route   DELETE /api/questions/:id
// @access  Private (Admin)
const deleteQuestion = asyncHandler(async(req, res) => {
    const questionId = req.params.id;

    const question = await Question.findById(questionId);

    if (!question) {
        res.status(404);
        throw new Error('Question not found');
    }

    await question.deleteOne();

    res.json({ message: 'Question removed' });
});

module.exports = {
    submitQuestion,
    getProductQuestions,
    getAllQuestions,
    answerQuestion,
    approveQuestion,
    deleteQuestion
};