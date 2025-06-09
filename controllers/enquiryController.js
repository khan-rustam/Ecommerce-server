const Enquiry = require("../models/Enquiry");
const { sendEmail } = require("../utils/sendEmail.js");

// Create a new enquiry
const createEnquiry = async(req, res) => {
    try {
        const { name, email, message } = req.body;

        if (!name || !email || !message) {
            return res.status(400).json({ message: "Please fill in all fields." });
        }

        const newEnquiry = new Enquiry({ name, email, message });
        await newEnquiry.save();

        res.status(201).json({ message: "Enquiry submitted successfully!" });
    } catch (error) {
        console.error("Error creating enquiry:", error);
        res.status(500).json({ message: "Server Error" });
    }
};

// Get all enquiries (Admin only)
const getAllEnquiries = async(req, res) => {
    try {
        // In a real app, add authentication/authorization to ensure only admins can access this
        const enquiries = await Enquiry.find().sort({ createdAt: -1 });
        res.status(200).json(enquiries);
    } catch (error) {
        console.error("Error fetching enquiries:", error);
        res.status(500).json({ message: "Server Error" });
    }
};

// Respond to an enquiry (Admin only) and send email
const respondToEnquiry = async(req, res) => {
    try {
        // In a real app, add authentication/authorization to ensure only admins can access this
        const { id } = req.params;
        const { responseText } = req.body;

        if (!responseText) {
            return res.status(400).json({ message: "Response text is required." });
        }

        const enquiry = await Enquiry.findById(id);

        if (!enquiry) {
            return res.status(404).json({ message: "Enquiry not found." });
        }

        enquiry.response = responseText;
        enquiry.responded = true;
        await enquiry.save();

        // --- Email Sending Logic (Integration Needed) ---
        // You would typically use a library like Nodemailer here
        try {
            await sendEmail({
                to: enquiry.email,
                subject: `Response to your enquiry from ${process.env.COMPANY_NAME}`,
                text: `Dear ${enquiry.name},
              Thank you for contacting us. Here is the response to your enquiry:

              ${responseText}

              Best regards,
              ${process.env.COMPANY_NAME}`,
                // html: '<p>HTML version of the email</p>'
            });
            console.log(`Response email sent to ${enquiry.email}`);
        } catch (emailError) {
            console.error("Error sending response email:", emailError);
            // Decide how to handle email sending failure (e.g., log, notify admin)
        }
        // ------------------------------------------------

        res.status(200).json({ message: "Response sent successfully!", enquiry });
    } catch (error) {
        console.error("Error responding to enquiry:", error);
        res.status(500).json({ message: "Server Error" });
    }
};

// Delete an enquiry (Admin only)
const deleteEnquiry = async(req, res) => {
    try {
        const { id } = req.params;
        const deleted = await Enquiry.findByIdAndDelete(id);
        if (!deleted) {
            return res.status(404).json({ message: "Enquiry not found." });
        }
        res.status(200).json({ message: "Enquiry deleted successfully." });
    } catch (error) {
        console.error("Error deleting enquiry:", error);
        res.status(500).json({ message: "Server Error" });
    }
};

module.exports = {
    createEnquiry,
    getAllEnquiries,
    respondToEnquiry,
    deleteEnquiry,
};