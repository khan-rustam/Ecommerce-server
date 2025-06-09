const express = require("express");
const router = express.Router();
const {
    registerUser,
    loginUser,
    getUserProfile,
    requestOtp,
    verifyOtp,
    getAddresses,
    addAddress,
    editAddress,
    deleteAddress,
    getPaymentMethods,
    addPaymentMethod,
    editPaymentMethod,
    deletePaymentMethod,
    getAllUsers,
    updateUserRole,
    uploadAvatar,
    deleteUser,
} = require("../controllers/authController");
const jwt = require("jsonwebtoken");
const auth = require("../middleware/auth");

router.post("/register", registerUser);
router.post("/login", loginUser);

// Add JWT auth middleware
const authMiddleware = (req, res, next) => {
    const token = req.header("Authorization") ?
        req.header("Authorization").replace("Bearer ", "") :
        null;

    if (!token)
        return res.status(401).json({ msg: "No token, authorization denied" });
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        res.status(401).json({ msg: "Token is not valid" });
    }
};

router.get("/profile", authMiddleware, getUserProfile);
router.post("/request-otp", requestOtp);
router.post("/verify-otp", verifyOtp);
router.get("/address", auth, getAddresses);
router.post("/address", auth, addAddress);
router.put("/address/:id", auth, editAddress);
router.delete("/address/:id", auth, deleteAddress);
router.get("/payments", auth, getPaymentMethods);
router.post("/payments", auth, addPaymentMethod);
router.put("/payments/:id", auth, editPaymentMethod);
router.delete("/payments/:id", auth, deletePaymentMethod);

// Admin: Get all users
router.get("/admin/users", authMiddleware, getAllUsers);
// Admin: Update user role
router.put("/admin/users/:id/role", authMiddleware, updateUserRole);
// Admin: Delete user
router.delete("/admin/users/:id", authMiddleware, deleteUser);

router.post("/upload-avatar", authMiddleware, uploadAvatar);

module.exports = router;