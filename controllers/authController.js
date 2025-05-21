const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const nodemailer = require("nodemailer");
const Address = require("../models/Address");
const PaymentMethod = require("../models/PaymentMethod");
const { userAvatarStorage } = require('../middleware/cloudinary');
const multer = require('multer');

// In-memory store for OTPs (for demo; use DB in production)
const otpStore = {};

// Helper: send OTP email
async function sendOtpEmail(to, otp) {
    const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST_SMTP,
        port: process.env.EMAIL_PORT_SMTP,
        secure: true,
        auth: {
            user: process.env.EMAIL_ADMIN,
            pass: process.env.EMAIL_PASS,
        },
    });
    await transporter.sendMail({
        from: process.env.EMAIL_ADMIN,
        to,
        subject: "Your OTP for Profile Update",
        text: `Your OTP is: ${otp}`,
    });
}

// Register Controller
exports.registerUser = async(req, res) => {
    const { username, email, phoneNumber, password, confirmPassword } = req.body;
    if (!username || (!email && !phoneNumber) || !password || !confirmPassword) {
        return res.status(400).json({ msg: "Please enter all required fields" });
    }
    if (password !== confirmPassword) {
        return res.status(400).json({ msg: "Passwords do not match" });
    }
    try {
        // Build a dynamic query for existing user
        const query = [];
        if (email) query.push({ email });
        if (phoneNumber) query.push({ phoneNumber });
        if (username) query.push({ username });
        let user = await User.findOne({ $or: query });
        if (user) {
            return res.status(400).json({ msg: "User already exists" });
        }
        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        // Create user
        user = new User({
            username,
            email: email || undefined,
            phoneNumber: phoneNumber || undefined,
            password: hashedPassword,
        });
        await user.save();
        res.status(201).json({ msg: "User registered successfully" });
    } catch (err) {
        res.status(500).json({ msg: "Server error", error: err.message });
    }
};

// Login Controller
exports.loginUser = async(req, res) => {
    const { email, phoneNumber, password } = req.body;
    if ((!email && !phoneNumber) || !password) {
        return res.status(400).json({ msg: "Please enter all fields" });
    }
    try {
        // Find user by email (priority) or phone
        let user = null;
        if (email) {
            user = await User.findOne({ email });
        }
        if (!user && phoneNumber) {
            user = await User.findOne({ phoneNumber });
        }
        if (!user) {
            return res.status(400).json({ msg: "Invalid credentials" });
        }
        // Compare password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ msg: "Invalid credentials" });
        }
        // Create JWT
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
            expiresIn: "1d",
        });
        res.json({
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                phoneNumber: user.phoneNumber,
                isAdmin: user.isAdmin,
            },
        });
    } catch (err) {
        res.status(500).json({ msg: "Server error", error: err.message });
    }
};

// Get User Profile
exports.getUserProfile = async(req, res) => {
    try {
        const user = await User.findById(req.user.id).select("-password");
        if (!user) {
            return res.status(404).json({ msg: "User not found" });
        }
        res.json(user);
    } catch (err) {
        res.status(500).json({ msg: "Server error", error: err.message });
    }
};

// Request OTP for profile update
exports.requestOtp = async(req, res) => {
    const { email, updateData } = req.body;
    if (!email) return res.status(400).json({ msg: "Email required" });
    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ msg: "User not found" });
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    otpStore[email] = { otp, updateData, expires: Date.now() + 10 * 60 * 1000 };
    try {
        await sendOtpEmail(email, otp);
        res.json({ msg: "OTP sent to email" });
    } catch (err) {
        res.status(500).json({ msg: "Failed to send OTP", error: err.message });
    }
};

// Verify OTP and update profile
exports.verifyOtp = async(req, res) => {
    const { email, otp, updateData } = req.body;
    const entry = otpStore[email];
    if (!entry || entry.otp !== otp || Date.now() > entry.expires) {
        return res.status(400).json({ msg: "Invalid or expired OTP" });
    }
    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ msg: "User not found" });
        // If no updateData or updateData is empty, just verify OTP
        if (!updateData || Object.keys(updateData).length === 0) {
            return res.json({ msg: "OTP verified", otpValid: true });
        }
        // Update any provided fields
        if (updateData.password) {
            user.password = await bcrypt.hash(updateData.password, 10);
        }
        if (updateData.username) user.username = updateData.username;
        if (updateData.phoneNumber) user.phoneNumber = updateData.phoneNumber;
        await user.save();
        delete otpStore[email];
        res.json({ msg: "Profile updated successfully" });
    } catch (err) {
        res
            .status(500)
            .json({ msg: "Failed to update profile", error: err.message });
    }
};

// Get all addresses for logged-in user
exports.getAddresses = async(req, res) => {
    try {
        const addresses = await Address.find({ user: req.user.id });
        res.json(addresses);
    } catch (err) {
        res
            .status(500)
            .json({ msg: "Failed to fetch addresses", error: err.message });
    }
};

// Add a new address for logged-in user
exports.addAddress = async(req, res) => {
    const { name, addressLine1, city, country, pincode, landmark, phone } =
    req.body;
    if (!name || !addressLine1 || !city || !country || !pincode || !phone) {
        return res.status(400).json({ msg: "Please fill all required fields" });
    }
    try {
        const address = new Address({
            user: req.user.id,
            name,
            addressLine1,
            city,
            country,
            pincode,
            landmark,
            phone,
        });
        await address.save();
        res.status(201).json({ msg: "Address added successfully", address });
    } catch (err) {
        res.status(500).json({ msg: "Failed to add address", error: err.message });
    }
};

// Edit an address for logged-in user
exports.editAddress = async(req, res) => {
    const { id } = req.params;
    const { name, addressLine1, city, country, pincode, landmark, phone } =
    req.body;
    try {
        const address = await Address.findOne({ _id: id, user: req.user.id });
        if (!address) return res.status(404).json({ msg: "Address not found" });
        address.name = name;
        address.addressLine1 = addressLine1;
        address.city = city;
        address.country = country;
        address.pincode = pincode;
        address.landmark = landmark;
        address.phone = phone;
        await address.save();
        res.json({ msg: "Address updated", address });
    } catch (err) {
        res
            .status(500)
            .json({ msg: "Failed to update address", error: err.message });
    }
};

// Delete an address for logged-in user
exports.deleteAddress = async(req, res) => {
    const { id } = req.params;
    try {
        const address = await Address.findOneAndDelete({
            _id: id,
            user: req.user.id,
        });
        if (!address) return res.status(404).json({ msg: "Address not found" });
        res.json({ msg: "Address deleted" });
    } catch (err) {
        res
            .status(500)
            .json({ msg: "Failed to delete address", error: err.message });
    }
};

// Get all payment methods for logged-in user
exports.getPaymentMethods = async(req, res) => {
    try {
        const payments = await PaymentMethod.find({ user: req.user.id });
        res.json(payments);
    } catch (err) {
        res
            .status(500)
            .json({ msg: "Failed to fetch payment methods", error: err.message });
    }
};

// Add a new payment method for logged-in user
exports.addPaymentMethod = async(req, res) => {
    const { type, last4, expiry, cardToken } = req.body;
    if (!type || !last4 || !expiry || !cardToken) {
        return res.status(400).json({ msg: "Please fill all required fields" });
    }
    try {
        const payment = new PaymentMethod({
            user: req.user.id,
            type,
            last4,
            expiry,
            cardToken,
        });
        await payment.save();
        res.status(201).json({ msg: "Payment method added", payment });
    } catch (err) {
        res
            .status(500)
            .json({ msg: "Failed to add payment method", error: err.message });
    }
};

// Edit a payment method for logged-in user
exports.editPaymentMethod = async(req, res) => {
    const { id } = req.params;
    const { type, last4, expiry, cardToken } = req.body;
    try {
        const payment = await PaymentMethod.findOne({ _id: id, user: req.user.id });
        if (!payment)
            return res.status(404).json({ msg: "Payment method not found" });
        payment.type = type;
        payment.last4 = last4;
        payment.expiry = expiry;
        payment.cardToken = cardToken;
        await payment.save();
        res.json({ msg: "Payment method updated", payment });
    } catch (err) {
        res
            .status(500)
            .json({ msg: "Failed to update payment method", error: err.message });
    }
};

// Delete a payment method for logged-in user
exports.deletePaymentMethod = async(req, res) => {
    const { id } = req.params;
    try {
        const payment = await PaymentMethod.findOneAndDelete({
            _id: id,
            user: req.user.id,
        });
        if (!payment)
            return res.status(404).json({ msg: "Payment method not found" });
        res.json({ msg: "Payment method deleted" });
    } catch (err) {
        res
            .status(500)
            .json({ msg: "Failed to delete payment method", error: err.message });
    }
};

// Get all users (admin only)
exports.getAllUsers = async(req, res) => {
    const requestingUser = await User.findById(req.user.id);
    if (!requestingUser || !requestingUser.isAdmin) {
        return res.status(403).json({ msg: "Forbidden: Admins only" });
    }
    try {
        const users = await User.find({}, "username email isAdmin");
        // Map _id to id for frontend compatibility
        const usersWithId = users.map((u) => ({
            id: u._id,
            username: u.username,
            email: u.email,
            isAdmin: u.isAdmin,
        }));
        res.json(usersWithId);
    } catch (err) {
        res.status(500).json({ msg: "Failed to fetch users", error: err.message });
    }
};

// Update user role (admin only)
exports.updateUserRole = async(req, res) => {
    const requestingUser = await User.findById(req.user.id);
    if (!requestingUser || !requestingUser.isAdmin) {
        return res.status(403).json({ msg: "Forbidden: Admins only" });
    }
    const { id } = req.params;
    const { isAdmin } = req.body;
    try {
        const user = await User.findById(id);
        if (!user) return res.status(404).json({ msg: "User not found" });
        user.isAdmin = isAdmin;
        await user.save();
        res.json({
            msg: "User role updated",
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                isAdmin: user.isAdmin,
            },
        });
    } catch (err) {
        res
            .status(500)
            .json({ msg: "Failed to update user role", error: err.message });
    }
};

// Upload user avatar
exports.uploadAvatar = async(req, res) => {
    try {
        const userId = req.user.id;
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ msg: 'User not found' });
        // Use multer with user-specific storage
        const upload = multer({ storage: userAvatarStorage(user.username) }).single('avatar');
        upload(req, res, async function(err) {
            if (err) return res.status(400).json({ msg: 'Upload error', error: err.message });
            if (!req.file) return res.status(400).json({ msg: 'No file uploaded' });
            // Delete old avatar from Cloudinary if exists
            if (user.avatarPublicId) {
                try {
                    await require('../middleware/cloudinary').cloudinary.uploader.destroy(user.avatarPublicId);
                } catch (e) {
                    // Optionally log error, but don't block user
                }
            }
            user.avatar = req.file.path;
            user.avatarPublicId = req.file.filename; // CloudinaryStorage sets this
            await user.save();
            res.json({ msg: 'Avatar uploaded', avatar: user.avatar });
        });
    } catch (err) {
        res.status(500).json({ msg: 'Failed to upload avatar', error: err.message });
    }
};