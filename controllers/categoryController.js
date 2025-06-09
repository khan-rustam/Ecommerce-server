const Category = require('../models/Category');
const cloudinary = require('cloudinary').v2;
const { Readable } = require('stream');

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Get all categories
exports.getAllCategories = async(req, res) => {
    try {
        // Check if the request is from an admin user
        // Either from auth middleware or from query parameter
        const isAdmin = (req.user && req.user.isAdmin) || req.query.admin === 'true';

        // If admin, show all categories; otherwise filter out hidden ones
        const filter = isAdmin ? {} : { isHidden: false };

        const categories = await Category.find(filter)
            .populate('parent', 'name')
            .sort({ name: 1 });
        res.status(200).json(categories);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching categories', error: error.message });
    }
};

// Get popular categories
exports.getPopularCategories = async(req, res) => {
    try {
        const categories = await Category.find({ isPopular: true, isHidden: false })
            .populate('parent', 'name')
            .sort({ name: 1 });
        res.status(200).json(categories);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching popular categories', error: error.message });
    }
};

// Get a single category by ID
exports.getCategoryById = async(req, res) => {
    try {
        const category = await Category.findById(req.params.id)
            .populate('parent', 'name');

        if (!category) {
            return res.status(404).json({ message: 'Category not found' });
        }

        // Check if category is hidden and user is not admin
        const isAdmin = req.user && req.user.isAdmin;
        if (category.isHidden && !isAdmin) {
            return res.status(404).json({ message: 'Category not found' });
        }

        res.status(200).json(category);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching category', error: error.message });
    }
};

// Get a single category by slug
exports.getCategoryBySlug = async(req, res) => {
    try {
        const category = await Category.findOne({ slug: req.params.slug })
            .populate('parent', 'name');

        if (!category) {
            return res.status(404).json({ message: 'Category not found' });
        }

        // Check if category is hidden and user is not admin
        const isAdmin = req.user && req.user.isAdmin;
        if (category.isHidden && !isAdmin) {
            return res.status(404).json({ message: 'Category not found' });
        }

        res.status(200).json(category);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching category', error: error.message });
    }
};

// Create a new category
exports.createCategory = async(req, res) => {
    try {
        const { name, description, parent, image, imagePublicId } = req.body;

        // Check if category with the same name already exists
        const existingCategory = await Category.findOne({ name });
        if (existingCategory) {
            return res.status(400).json({ message: 'Category with this name already exists' });
        }

        // Create new category
        const category = new Category({
            name,
            description,
            image,
            imagePublicId,
            createdBy: req.user ? req.user._id : undefined,
        });

        // If parent category is provided, set it
        if (parent) {
            const parentCategory = await Category.findById(parent);
            if (!parentCategory) {
                return res.status(400).json({ message: 'Parent category not found' });
            }
            category.parent = parent;
        }

        await category.save();
        res.status(201).json(category);
    } catch (error) {
        res.status(500).json({ message: 'Error creating category', error: error.message });
    }
};

// Update a category
exports.updateCategory = async(req, res) => {
    try {
        const { name, description, parent, isHidden, isPopular } = req.body;

        const category = await Category.findById(req.params.id);
        if (!category) {
            return res.status(404).json({ message: 'Category not found' });
        }

        // Check if updating name and if the name is already taken
        if (name && name !== category.name) {
            const existingCategory = await Category.findOne({ name });
            if (existingCategory) {
                return res.status(400).json({ message: 'Category with this name already exists' });
            }
            category.name = name;
        }

        if (description !== undefined) category.description = description;

        // Handle parent category update
        if (parent !== undefined) {
            // If parent is null or empty string, remove parent
            if (!parent) {
                category.parent = null;
            } else {
                // Check that we're not creating a circular reference
                if (parent.toString() === category._id.toString()) {
                    return res.status(400).json({ message: 'Category cannot be its own parent' });
                }

                const parentCategory = await Category.findById(parent);
                if (!parentCategory) {
                    return res.status(400).json({ message: 'Parent category not found' });
                }

                category.parent = parent;
            }
        }

        if (isHidden !== undefined) category.isHidden = isHidden;
        if (isPopular !== undefined) category.isPopular = isPopular;

        await category.save();

        // Return the updated category with parent populated
        const updatedCategory = await Category.findById(category._id)
            .populate('parent', 'name');

        res.status(200).json(updatedCategory);
    } catch (error) {
        res.status(500).json({ message: 'Error updating category', error: error.message });
    }
};

// Delete a category
exports.deleteCategory = async(req, res) => {
    try {
        const category = await Category.findById(req.params.id);

        if (!category) {
            return res.status(404).json({ message: 'Category not found' });
        }

        // Check if this category is a parent to other categories
        const childCategories = await Category.find({ parent: category._id });
        if (childCategories.length > 0) {
            return res.status(400).json({
                message: 'Cannot delete category with child categories. Delete or reassign children first.',
                childCategories: childCategories.map(c => ({ id: c._id, name: c.name }))
            });
        }

        // Delete image from Cloudinary if it exists
        if (category.imagePublicId) {
            try {
                await cloudinary.uploader.destroy(category.imagePublicId);
            } catch (cloudinaryError) {
                console.error('Error deleting image from Cloudinary:', cloudinaryError);
            }
        }

        await Category.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: 'Category deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting category', error: error.message });
    }
};

// Toggle category visibility
exports.toggleVisibility = async(req, res) => {
    try {
        const category = await Category.findById(req.params.id);

        if (!category) {
            return res.status(404).json({ message: 'Category not found' });
        }

        // Toggle visibility
        const newVisibility = !category.isHidden;
        category.isHidden = newVisibility;
        await category.save();

        // Check if we should cascade the visibility change to subcategories
        // This happens when the frontend sends { cascade: true } in the request body
        if (newVisibility && req.body.cascade) {
            // Find all subcategories
            const subcategories = await Category.find({ parent: category._id });

            // Update all subcategories to match parent visibility
            if (subcategories.length > 0) {
                const updatePromises = subcategories.map(async(subcat) => {
                    subcat.isHidden = true;
                    return subcat.save();
                });

                await Promise.all(updatePromises);
            }
        }

        res.status(200).json(category);
    } catch (error) {
        res.status(500).json({ message: 'Error toggling visibility', error: error.message });
    }
};

// Toggle category popularity
exports.togglePopularity = async(req, res) => {
    try {
        const category = await Category.findById(req.params.id);

        if (!category) {
            return res.status(404).json({ message: 'Category not found' });
        }

        category.isPopular = !category.isPopular;
        await category.save();

        res.status(200).json(category);
    } catch (error) {
        res.status(500).json({ message: 'Error toggling popularity', error: error.message });
    }
};

// Upload category image
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
                    folder: 'categories',
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