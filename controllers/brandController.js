const Brand = require('../models/Brand');
const cloudinary = require('cloudinary').v2;
const { Readable } = require('stream');

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Get all brands
exports.getAllBrands = async(req, res) => {
    try {
        const brands = await Brand.find().sort({ name: 1 });
        res.status(200).json(brands);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching brands', error: error.message });
    }
};

// Get a single brand by ID
exports.getBrandById = async(req, res) => {
    try {
        const brand = await Brand.findById(req.params.id);
        if (!brand) {
            return res.status(404).json({ message: 'Brand not found' });
        }
        res.status(200).json(brand);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching brand', error: error.message });
    }
};

// Get a single brand by slug
exports.getBrandBySlug = async(req, res) => {
    try {
        const brand = await Brand.findOne({ slug: req.params.slug });
        if (!brand) {
            return res.status(404).json({ message: 'Brand not found' });
        }
        res.status(200).json(brand);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching brand', error: error.message });
    }
};

// Create a new brand
exports.createBrand = async(req, res) => {
    try {
        const { name, description, category } = req.body;

        // Check if brand with the same name already exists
        const existingBrand = await Brand.findOne({ name });
        if (existingBrand) {
            return res.status(400).json({ message: 'Brand with this name already exists' });
        }

        // Create new brand
        const brand = new Brand({
            name,
            description,
            category,
            createdBy: req.user ? req.user._id : undefined,
        });

        await brand.save();
        res.status(201).json(brand);
    } catch (error) {
        res.status(500).json({ message: 'Error creating brand', error: error.message });
    }
};

// Update a brand
exports.updateBrand = async(req, res) => {
    try {
        const { name, description, category, isHidden } = req.body;

        const brand = await Brand.findById(req.params.id);
        if (!brand) {
            return res.status(404).json({ message: 'Brand not found' });
        }

        // Check if updating name and if the name is already taken
        if (name && name !== brand.name) {
            const existingBrand = await Brand.findOne({ name });
            if (existingBrand) {
                return res.status(400).json({ message: 'Brand with this name already exists' });
            }
            brand.name = name;
        }

        if (description !== undefined) brand.description = description;
        if (category !== undefined) brand.category = category;
        if (isHidden !== undefined) brand.isHidden = isHidden;

        await brand.save();
        res.status(200).json(brand);
    } catch (error) {
        res.status(500).json({ message: 'Error updating brand', error: error.message });
    }
};

// Delete a brand
exports.deleteBrand = async(req, res) => {
    try {
        const brand = await Brand.findById(req.params.id);

        if (!brand) {
            return res.status(404).json({ message: 'Brand not found' });
        }

        // Delete logo from Cloudinary if it exists
        if (brand.logoPublicId) {
            try {
                await cloudinary.uploader.destroy(brand.logoPublicId);
            } catch (cloudinaryError) {
                console.error('Error deleting image from Cloudinary:', cloudinaryError);
            }
        }

        await Brand.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: 'Brand deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting brand', error: error.message });
    }
};

// Upload brand logo
exports.uploadLogo = async(req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        // Create a buffer stream from the file buffer
        const stream = Readable.from(req.file.buffer);

        // Create a promise to handle the Cloudinary upload
        const uploadPromise = new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream({
                    folder: 'brands',
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
            logo: uploadResult.secure_url,
            logoPublicId: uploadResult.public_id
        });
    } catch (error) {
        console.error('Error uploading to Cloudinary:', error);
        res.status(500).json({ message: 'Error uploading image', error: error.message });
    }
};

// Update brand logo
exports.updateLogo = async(req, res) => {
    try {
        const brand = await Brand.findById(req.params.id);

        if (!brand) {
            return res.status(404).json({ message: 'Brand not found' });
        }

        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        // Delete old logo from Cloudinary if it exists
        if (brand.logoPublicId) {
            try {
                await cloudinary.uploader.destroy(brand.logoPublicId);
            } catch (cloudinaryError) {
                console.error('Error deleting old image from Cloudinary:', cloudinaryError);
            }
        }

        // Create a buffer stream from the file buffer
        const stream = Readable.from(req.file.buffer);

        // Create a promise to handle the Cloudinary upload
        const uploadPromise = new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream({
                    folder: 'brands',
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

        // Update brand with new logo
        brand.logo = uploadResult.secure_url;
        brand.logoPublicId = uploadResult.public_id;

        await brand.save();

        res.status(200).json(brand);
    } catch (error) {
        console.error('Error updating logo:', error);
        res.status(500).json({ message: 'Error updating logo', error: error.message });
    }
};

// Toggle brand visibility
exports.toggleVisibility = async(req, res) => {
    try {
        const brand = await Brand.findById(req.params.id);

        if (!brand) {
            return res.status(404).json({ message: 'Brand not found' });
        }

        brand.isHidden = !brand.isHidden;
        await brand.save();

        res.status(200).json(brand);
    } catch (error) {
        res.status(500).json({ message: 'Error toggling visibility', error: error.message });
    }
};