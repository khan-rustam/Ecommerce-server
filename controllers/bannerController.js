const Banner = require('../models/Banner');
const cloudinary = require('cloudinary').v2;
const { Readable } = require('stream');

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Upload banner image to Cloudinary
exports.uploadBanner = async(req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        // Create a buffer stream from the file buffer
        const stream = Readable.from(req.file.buffer);

        // Create a promise to handle the Cloudinary upload
        const uploadPromise = new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream({
                    folder: 'banners',
                    resource_type: 'image'
                },
                (error, result) => {
                    if (error) reject(error);
                    else resolve(result);
                }
            );

            // Pipe the file buffer to the upload stream
            stream.pipe(uploadStream);
        });

        // Wait for the upload to complete
        const uploadResult = await uploadPromise;

        // Return the secure URL
        res.status(200).json({
            imageUrl: uploadResult.secure_url,
            publicId: uploadResult.public_id
        });

    } catch (error) {
        console.error('Error uploading to Cloudinary:', error);
        res.status(500).json({ message: 'Error uploading image', error: error.message });
    }
};

// Get all banners
exports.getAllBanners = async(req, res) => {
    try {
        const banners = await Banner.find().sort({ createdAt: -1 });
        res.status(200).json(banners);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching banners', error: error.message });
    }
};

// Get active banners (show = true)
exports.getActiveBanners = async(req, res) => {
    try {
        const banners = await Banner.find({ show: true }).sort({ createdAt: -1 });
        res.status(200).json(banners);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching active banners', error: error.message });
    }
};

// Create a new banner
exports.createBanner = async(req, res) => {
    try {
        const { path, name, show } = req.body;

        if (!path) {
            return res.status(400).json({ message: 'Banner path is required' });
        }

        // Validate that the path is a valid URL (for Cloudinary)
        if (!path.startsWith('http')) {
            return res.status(400).json({ message: 'Invalid image URL format' });
        }

        const banner = new Banner({
            path,
            name: name || 'Unnamed Banner',
            show: show !== undefined ? show : true,
            createdBy: req.user ? req.user._id : undefined,
        });

        await banner.save();
        res.status(201).json(banner);
    } catch (error) {
        res.status(500).json({ message: 'Error creating banner', error: error.message });
    }
};

// Toggle banner visibility
exports.toggleBannerVisibility = async(req, res) => {
    try {
        const { id } = req.params;
        const banner = await Banner.findById(id);

        if (!banner) {
            return res.status(404).json({ message: 'Banner not found' });
        }

        banner.show = !banner.show;
        await banner.save();

        res.status(200).json(banner);
    } catch (error) {
        res.status(500).json({ message: 'Error updating banner', error: error.message });
    }
};

// Delete a banner
exports.deleteBanner = async(req, res) => {
    try {
        const { id } = req.params;
        const banner = await Banner.findByIdAndDelete(id);

        if (!banner) {
            return res.status(404).json({ message: 'Banner not found' });
        }

        res.status(200).json({ message: 'Banner deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting banner', error: error.message });
    }
};