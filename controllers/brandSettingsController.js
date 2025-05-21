const BrandSettings = require("../models/BrandSettings");

// Get all settings
exports.getBrandSettings = async(req, res) => {
    try {
        let settings = await BrandSettings.findOne();
        if (!settings) settings = await BrandSettings.create({});
        res.json(settings);
    } catch (err) {
        res
            .status(500)
            .json({ msg: "Failed to fetch settings", error: err.message });
    }
};

// Update all settings
exports.updateBrandSettings = async(req, res) => {
    try {
        let settings = await BrandSettings.findOne();
        if (!settings) settings = new BrandSettings();
        Object.assign(settings, req.body);
        // Ensure logoWidth and logoHeight are numbers if provided
        if (req.body.logoWidth !== undefined)
            settings.logoWidth = Number(req.body.logoWidth);
        if (req.body.logoHeight !== undefined)
            settings.logoHeight = Number(req.body.logoHeight);
        // Ensure hero font sizes are numbers if provided
        if (req.body.heroTitleFontSize !== undefined)
            settings.heroTitleFontSize = Number(req.body.heroTitleFontSize);
        if (req.body.heroSubtitleFontSize !== undefined)
            settings.heroSubtitleFontSize = Number(req.body.heroSubtitleFontSize);
        await settings.save();
        res.json({ msg: "Settings updated", settings });
    } catch (err) {
        res
            .status(500)
            .json({ msg: "Failed to update settings", error: err.message });
    }
};

// Upload image (logo or hero)
exports.uploadImage = async(req, res) => {
    try {
        if (!req.file || !req.query.type)
            return res.status(400).json({ msg: "No file or type" });
        let settings = await BrandSettings.findOne();
        if (!settings) settings = new BrandSettings();
        if (req.query.type === "logo") {
            // Delete old logo from Cloudinary if exists
            if (settings.logoPublicId) {
                try {
                    await require("../middleware/cloudinary").cloudinary.uploader.destroy(
                        settings.logoPublicId
                    );
                } catch (e) {
                    // Optionally log error, but don't block user
                }
            }
            settings.logoUrl = req.file.path;
            settings.logoPublicId = req.file.filename; // CloudinaryStorage sets this
        }
        if (req.query.type === "hero") {
            // Delete old hero banner from Cloudinary if exists
            if (settings.heroBannerPublicId) {
                try {
                    await require("../middleware/cloudinary").cloudinary.uploader.destroy(
                        settings.heroBannerPublicId
                    );
                } catch (e) {
                    // Optionally log error, but don't block user
                }
            }
            settings.heroBannerUrl = req.file.path;
            settings.heroBannerPublicId = req.file.filename;
            // For backward compatibility
            settings.heroImageUrl = req.file.path;
        }
        await settings.save();
        res.json({ msg: "Image uploaded", url: req.file.path, settings });
    } catch (err) {
        // Multer file size error
        if (err.code === "LIMIT_FILE_SIZE") {
            return res.status(413).json({
                msg: "Banner image is too large. Please upload an image under 2MB.",
            });
        }
        res.status(500).json({ msg: "Failed to upload image", error: err.message });
    }
};

// Delete hero banner
exports.deleteHeroBanner = async(req, res) => {
    try {
        let settings = await BrandSettings.findOne();
        if (!settings) return res.status(404).json({ msg: "Settings not found" });
        if (settings.heroBannerPublicId) {
            try {
                await require("../middleware/cloudinary").cloudinary.uploader.destroy(
                    settings.heroBannerPublicId
                );
            } catch (e) {
                // Optionally log error, but don't block user
            }
        }
        settings.heroBannerUrl = "";
        settings.heroBannerPublicId = "";
        settings.heroImageUrl = "";
        await settings.save();
        res.json({ msg: "Hero banner deleted", settings });
    } catch (err) {
        res
            .status(500)
            .json({ msg: "Failed to delete hero banner", error: err.message });
    }
};