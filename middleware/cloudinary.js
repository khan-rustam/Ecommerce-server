const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const multer = require("multer");

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
    cloudinary,
    params: async(req, file) => {
        let folder = "ecommerce/settings";
        if (req && req.query && req.query.type === "logo")
            folder = "ecommerce/settings/logo";
        if (req && req.query && req.query.type === "hero")
            folder = "ecommerce/settings/hero";
        return {
            folder,
            allowed_formats: ["jpg", "jpeg", "png", "webp"],
        };
    },
});

const upload = multer({
    storage,
    limits: { fileSize: 2 * 1024 * 1024 }, // 2MB limit for all uploads
});

// Helper to create user-specific storage for avatars
function userAvatarStorage(username) {
    return new CloudinaryStorage({
        cloudinary,
        params: {
            folder: `users/${username}/avatars`,
            allowed_formats: ["jpg", "jpeg", "png", "webp"],
            transformation: [{ width: 300, height: 300, crop: "limit" }],
        },
    });
}

module.exports = { cloudinary, upload, userAvatarStorage };