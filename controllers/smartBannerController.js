const SmartBanner = require('../models/SmartBanner');
const cloudinary = require('cloudinary').v2;
const { Readable } = require('stream');

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Get all smart banners
exports.getAllSmartBanners = async(req, res) => {
    try {
        const smartBanners = await SmartBanner.find()
            .sort({ createdAt: -1 });
        res.status(200).json(smartBanners);
    } catch (error) {
        console.error('Error fetching smart banners:', error);
        res.status(500).json({ message: 'Error fetching smart banners', error: error.message });
    }
};

// Get a single smart banner by ID
exports.getSmartBannerById = async(req, res) => {
    try {
        const banner = await SmartBanner.findById(req.params.id);
        if (!banner) {
            return res.status(404).json({ message: 'Smart banner not found' });
        }
        res.status(200).json(banner);
    } catch (error) {
        console.error('Error fetching smart banner:', error);
        res.status(500).json({ message: 'Error fetching smart banner', error: error.message });
    }
};

// Get active smart banners
exports.getActiveSmartBanners = async(req, res) => {
    try {
        const page = req.query.page || 'home';
        const now = new Date();

        const query = {
            isActive: true,
            showOnPages: page,
            $or: [
                { endDate: { $exists: false } },
                { endDate: null },
                { endDate: { $gte: now } }
            ],
            startDate: { $lte: now }
        };

        const smartBanners = await SmartBanner.find(query);
        res.status(200).json(smartBanners);
    } catch (error) {
        console.error('Error fetching active smart banners:', error);
        res.status(500).json({ message: 'Error fetching active smart banners', error: error.message });
    }
};

// Create smart banner
exports.createSmartBanner = async(req, res) => {
    try {
        const {
            title,
            content,
            image,
            imagePublicId,
            url,
            isActive,
            displayType,
            startDate,
            endDate,
            showOnPages,
            frequency
        } = req.body;

        const smartBanner = new SmartBanner({
            title,
            content,
            image,
            imagePublicId,
            url,
            isActive: isActive !== undefined ? isActive : true,
            displayType: displayType || 'popup',
            startDate: startDate || new Date(),
            endDate: endDate || null,
            showOnPages: showOnPages || ['home'],
            frequency: frequency || 'always',
            createdBy: req.user ? req.user._id : undefined
        });

        await smartBanner.save();
        res.status(201).json(smartBanner);
    } catch (error) {
        console.error('Error creating smart banner:', error);
        res.status(500).json({ message: 'Error creating smart banner', error: error.message });
    }
};

// Update smart banner
exports.updateSmartBanner = async(req, res) => {
    try {
        const {
            title,
            content,
            image,
            imagePublicId,
            url,
            isActive,
            displayType,
            startDate,
            endDate,
            showOnPages,
            frequency
        } = req.body;

        const banner = await SmartBanner.findById(req.params.id);
        if (!banner) {
            return res.status(404).json({ message: 'Smart banner not found' });
        }

        // Update fields if they are provided
        if (title !== undefined) banner.title = title;
        if (content !== undefined) banner.content = content;
        if (image !== undefined) banner.image = image;
        if (imagePublicId !== undefined) banner.imagePublicId = imagePublicId;
        if (url !== undefined) banner.url = url;
        if (isActive !== undefined) banner.isActive = isActive;
        if (displayType !== undefined) banner.displayType = displayType;
        if (startDate !== undefined) banner.startDate = startDate;
        if (endDate !== undefined) banner.endDate = endDate;
        if (showOnPages !== undefined) banner.showOnPages = showOnPages;
        if (frequency !== undefined) banner.frequency = frequency;

        await banner.save();
        res.status(200).json(banner);
    } catch (error) {
        console.error('Error updating smart banner:', error);
        res.status(500).json({ message: 'Error updating smart banner', error: error.message });
    }
};

// Delete smart banner
exports.deleteSmartBanner = async(req, res) => {
    try {
        const banner = await SmartBanner.findById(req.params.id);

        if (!banner) {
            return res.status(404).json({ message: 'Smart banner not found' });
        }

        // Delete image from Cloudinary if it exists
        if (banner.imagePublicId) {
            try {
                await cloudinary.uploader.destroy(banner.imagePublicId);
            } catch (cloudinaryError) {
                console.error('Error deleting image from Cloudinary:', cloudinaryError);
            }
        }

        await SmartBanner.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: 'Smart banner deleted successfully' });
    } catch (error) {
        console.error('Error deleting smart banner:', error);
        res.status(500).json({ message: 'Error deleting smart banner', error: error.message });
    }
};

// Toggle smart banner active status
exports.toggleActive = async(req, res) => {
    try {
        const banner = await SmartBanner.findById(req.params.id);

        if (!banner) {
            return res.status(404).json({ message: 'Smart banner not found' });
        }

        banner.isActive = !banner.isActive;
        await banner.save();

        res.status(200).json(banner);
    } catch (error) {
        console.error('Error toggling smart banner active status:', error);
        res.status(500).json({ message: 'Error toggling smart banner status', error: error.message });
    }
};

// Upload banner image
exports.uploadImage = async(req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        // Create a buffer stream from the file buffer
        const stream = Readable.from(req.file.buffer);

        // Create a promise to handle the Cloudinary upload
        const uploadPromise = new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream({
                    folder: 'smart-banners',
                    resource_type: 'image'
                },
                (error, result) => {
                    if (error) reject(error);
                    else resolve(result);
                });

            // Pipe the file buffer to the upload stream
            stream.pipe(uploadStream);
        });

        // Wait for the upload to complete
        const uploadResult = await uploadPromise;

        // Return the secure URL
        res.status(200).json({
            image: uploadResult.secure_url,
            imagePublicId: uploadResult.public_id
        });
    } catch (error) {
        console.error('Error uploading to Cloudinary:', error);
        res.status(500).json({ message: 'Error uploading image', error: error.message });
    }
};