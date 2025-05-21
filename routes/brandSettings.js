const express = require("express");
const router = express.Router();
const {
    getBrandSettings,
    updateBrandSettings,
    uploadImage,
    deleteHeroBanner,
} = require("../controllers/brandSettingsController");
const { upload } = require("../middleware/cloudinary");

router.get("/", getBrandSettings);
router.post("/", updateBrandSettings);
router.post("/upload", upload.single("image"), uploadImage);
router.delete("/upload", deleteHeroBanner);

module.exports = router;