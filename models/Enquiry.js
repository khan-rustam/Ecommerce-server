const mongoose = require('mongoose');

const EnquirySchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true },
    message: { type: String, required: true },
    responded: { type: Boolean, default: false },
    response: { type: String },
    createdAt: { type: Date, default: Date.now },
});

const Enquiry = mongoose.model("Enquiry", EnquirySchema);

module.exports = Enquiry;