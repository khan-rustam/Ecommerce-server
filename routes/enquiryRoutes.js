const express = require('express');
const { createEnquiry, getAllEnquiries, respondToEnquiry, deleteEnquiry } = require('../controllers/enquiryController');

const router = express.Router();

// Public route for submitting a contact form
router.post('/enquiries', createEnquiry);

// Admin routes
// In a real application, these routes should be protected (e.g., with authentication middleware)
router.get('/admin/enquiries', getAllEnquiries);
router.post('/admin/enquiries/:id/respond', respondToEnquiry);
router.delete('/admin/enquiries/:id', deleteEnquiry);

module.exports = router;