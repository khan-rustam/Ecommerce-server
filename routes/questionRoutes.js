const express = require('express');
const router = express.Router();
const {
    submitQuestion,
    getProductQuestions,
    getAllQuestions,
    answerQuestion,
    approveQuestion,
    deleteQuestion
} = require('../controllers/questionController');
const { isAuth, isAdmin } = require('../middleware/authMiddleware');

router.route('/').post(isAuth, submitQuestion).get(isAuth, isAdmin, getAllQuestions);
router.route('/product/:productId').get(getProductQuestions);
router.route('/:id/answer').put(isAuth, isAdmin, answerQuestion);
router.route('/:id/approve').put(isAuth, isAdmin, approveQuestion);
router.route('/:id').delete(isAuth, isAdmin, deleteQuestion);

module.exports = router;