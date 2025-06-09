const Product = require('../models/Product');
const Category = require('../models/Category');
const Brand = require('../models/Brand');
const cloudinary = require('cloudinary').v2;
const { Readable } = require('stream');
const { StatusCodes } = require('http-status-codes');
const Warehouse = require('../models/Warehouse');
const { getDistanceFromLatLonInKm } = require('../utils/location');

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Helper function to upload image to Cloudinary
const uploadImage = async(file, folder = 'products') => {
    return new Promise((resolve, reject) => {
        cloudinary.uploader.upload(
            file, { folder },
            (error, result) => {
                if (error) return reject(error);
                resolve({
                    url: result.secure_url,
                    public_id: result.public_id
                });
            }
        );
    });
};

// Helper function to delete image from Cloudinary
const deleteImage = async(publicId) => {
    return new Promise((resolve, reject) => {
        cloudinary.uploader.destroy(publicId, (error, result) => {
            if (error) return reject(error);
            resolve(result);
        });
    });
};

// Get all products with filtering, sorting, and pagination
const getAllProducts = async(req, res) => {
    try {
        const isAdmin = req.user && req.user.isAdmin;

        // Build query
        let query = {};

        // Filter by category
        if (req.query.category) {
            query.category = req.query.category;
        }

        // Filter by brand
        if (req.query.brand) {
            query.brand = req.query.brand;
        }

        // Filter by search term
        if (req.query.search) {
            query.$or = [
                { name: { $regex: req.query.search, $options: 'i' } },
                { description: { $regex: req.query.search, $options: 'i' } }
            ];
        }

        // For non-admin users, only show products with visible categories
        if (!isAdmin) {
            // Get all visible categories
            const visibleCategories = await Category.find({ isHidden: false }).select('_id');
            const visibleCategoryIds = visibleCategories.map(cat => cat._id);

            // Add category filter to query
            query.category = { $in: visibleCategoryIds };

            // Also filter out hidden products
            query.isHidden = { $ne: true };
        }

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        // Filter by price range if provided
        if (req.query.minPrice || req.query.maxPrice) {
            query.price = {};
            if (req.query.minPrice) query.price.$gte = parseInt(req.query.minPrice);
            if (req.query.maxPrice) query.price.$lte = parseInt(req.query.maxPrice);
        }

        // Filter by featured, new, trending
        if (req.query.featured === 'true') query.isFeatured = true;
        if (req.query.new === 'true') query.isNew = true;
        if (req.query.trending === 'true') query.isTrending = true;

        // Sorting
        let sort = {};
        if (req.query.sort) {
            switch (req.query.sort) {
                case 'price-asc':
                    sort = { price: 1 };
                    break;
                case 'price-desc':
                    sort = { price: -1 };
                    break;
                case 'newest':
                    sort = { createdAt: -1 };
                    break;
                case 'rating':
                    sort = { rating: -1 };
                    break;
                default:
                    sort = { createdAt: -1 };
            }
        } else {
            // Default sort by newest
            sort = { createdAt: -1 };
        }

        const products = await Product.find(query)
            .populate('category', 'name slug')
            .populate('brand', 'name slug')
            .sort(sort)
            .skip(skip)
            .limit(limit);

        const total = await Product.countDocuments(query);

        res.status(200).json({
            products,
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            total
        });
    } catch (error) {
        console.error('Error getting products:', error);
        res.status(500).json({ message: 'Error fetching products', error: error.message });
    }
};

// Get products by category slug
const getProductsByCategory = async(req, res) => {
    try {
        const { slug } = req.params;

        // Find category first
        const category = await Category.findOne({ slug });
        if (!category) {
            return res.status(404).json({ message: 'Category not found' });
        }

        // Get products with this category
        const products = await Product.find({ category: category._id })
            .populate('brand', 'name slug')
            .populate('category', 'name slug')
            .sort({ createdAt: -1 });

        res.status(200).json({ products });
    } catch (error) {
        console.error('Error getting products by category:', error);
        res.status(500).json({
            message: 'Failed to get products by category',
            error: error.message
        });
    }
};

// Get product by slug
const getProductBySlug = async(req, res) => {
    try {
        const { slug } = req.params;

        const product = await Product.findOne({ slug, isHidden: { $ne: true } })
            .populate('category', 'name slug')
            .populate('brand', 'name slug');

        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        res.status(200).json(product);
    } catch (error) {
        console.error('Error getting product by slug:', error);
        res.status(500).json({ message: 'Error fetching product', error: error.message });
    }
};

// Get all products for admin (including hidden)
const getAllProductsAdmin = async(req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const query = {};

        // Filter by category if provided
        if (req.query.category) {
            const category = await Category.findOne({ slug: req.query.category });
            if (category) {
                query.category = category._id;
            }
        }

        // Filter by brand if provided
        if (req.query.brand) {
            const brand = await Brand.findOne({ slug: req.query.brand });
            if (brand) {
                query.brand = brand._id;
            }
        }

        // Filter by search term if provided
        if (req.query.search) {
            query.name = { $regex: req.query.search, $options: 'i' };
        }

        // Sorting
        let sort = {};
        if (req.query.sort) {
            switch (req.query.sort) {
                case 'price-asc':
                    sort = { price: 1 };
                    break;
                case 'price-desc':
                    sort = { price: -1 };
                    break;
                case 'newest':
                    sort = { createdAt: -1 };
                    break;
                case 'oldest':
                    sort = { createdAt: 1 };
                    break;
                case 'name-asc':
                    sort = { name: 1 };
                    break;
                case 'name-desc':
                    sort = { name: -1 };
                    break;
                default:
                    sort = { createdAt: -1 };
            }
        } else {
            // Default sort by newest
            sort = { createdAt: -1 };
        }

        const products = await Product.find(query)
            .populate('category', 'name slug')
            .populate('brand', 'name slug')
            .sort(sort)
            .skip(skip)
            .limit(limit);

        const total = await Product.countDocuments(query);

        res.status(200).json({
            products,
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            total
        });
    } catch (error) {
        console.error('Error getting admin products:', error);
        res.status(500).json({ message: 'Error fetching products', error: error.message });
    }
};

// Create new product
const createProduct = async(req, res) => {
    try {
        const productData = req.body;

        // Add creator information if available
        if (req.user) {
            productData.createdBy = req.user._id;
        }

        // Create product
        const newProduct = new Product(productData);
        await newProduct.save();

        const product = await Product.findById(newProduct._id)
            .populate('category', 'name slug')
            .populate('brand', 'name slug');

        res.status(201).json(product);
    } catch (error) {
        console.error('Error creating product:', error);
        res.status(500).json({ message: 'Error creating product', error: error.message });
    }
};

// Update product
const updateProduct = async(req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        const product = await Product.findById(id);

        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        // Update product fields
        const updatedProduct = await Product.findByIdAndUpdate(
                id,
                updateData, { new: true, runValidators: true }
            ).populate('category', 'name slug')
            .populate('brand', 'name slug');

        res.status(200).json(updatedProduct);
    } catch (error) {
        console.error('Error updating product:', error);
        res.status(500).json({ message: 'Error updating product', error: error.message });
    }
};

// Delete product
const deleteProduct = async(req, res) => {
    try {
        const { id } = req.params;

        const product = await Product.findById(id);

        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        // Delete product images from cloudinary
        const imagesToDelete = [];

        // Check for images array with public_id property
        if (product.images && product.images.length > 0) {
            product.images.forEach(image => {
                if (image.public_id) {
                    imagesToDelete.push(image.public_id);
                }
            });
        }

        // Check for imagePublicIds array (older format)
        if (product.imagePublicIds && product.imagePublicIds.length > 0) {
            product.imagePublicIds.forEach(publicId => {
                if (publicId && !imagesToDelete.includes(publicId)) {
                    imagesToDelete.push(publicId);
                }
            });
        }

        // Delete all collected image IDs from Cloudinary
        for (const publicId of imagesToDelete) {
            try {
                await deleteImage(publicId);
                console.log(`Image ${publicId} deleted successfully from Cloudinary`);
            } catch (cloudinaryError) {
                console.error(`Error deleting image ${publicId} from Cloudinary:`, cloudinaryError);
                // Continue with deletion even if some images fail
            }
        }

        // Delete product from database
        await Product.findByIdAndDelete(id);

        res.status(200).json({
            message: 'Product deleted successfully',
            deletedImagesCount: imagesToDelete.length
        });
    } catch (error) {
        console.error('Error deleting product:', error);
        res.status(500).json({ message: 'Error deleting product', error: error.message });
    }
};

// Toggle product visibility
const toggleProductVisibility = async(req, res) => {
    try {
        const { id } = req.params;
        const product = await Product.findById(id);

        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        // Check if using new field names or old ones
        if (product.visibility) {
            product.visibility = product.visibility === 'visible' ? 'hidden' : 'visible';
        } else {
            product.isHidden = !product.isHidden;
        }
        await product.save();

        res.status(200).json({
            message: `Product is now ${product.visibility === 'hidden' || product.isHidden ? 'hidden' : 'visible'}`,
            isHidden: product.visibility === 'hidden' || product.isHidden
        });
    } catch (error) {
        console.error('Error toggling product visibility:', error);
        res.status(500).json({
            message: 'Failed to update product visibility',
            error: error.message
        });
    }
};

// Toggle featured status
const toggleFeatured = async(req, res) => {
    try {
        const { id } = req.params;
        const product = await Product.findById(id);

        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        product.featured = !product.featured;
        await product.save();

        res.status(200).json({
            message: `Product is ${product.featured ? 'now featured' : 'no longer featured'}`,
            featured: product.featured
        });
    } catch (error) {
        console.error('Error toggling featured status:', error);
        res.status(500).json({
            message: 'Failed to update featured status',
            error: error.message
        });
    }
};

// Toggle trending status
const toggleTrending = async(req, res) => {
    try {
        const { id } = req.params;
        const product = await Product.findById(id);

        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        product.isTrending = !product.isTrending;
        await product.save();

        res.status(200).json({
            message: `Product is ${product.isTrending ? 'now trending' : 'no longer trending'}`,
            isTrending: product.isTrending
        });
    } catch (error) {
        console.error('Error toggling trending status:', error);
        res.status(500).json({
            message: 'Failed to update trending status',
            error: error.message
        });
    }
};

/**
 * Upload product image to Cloudinary
 * @route POST /api/products/upload
 * @access Private/Admin
 */
const uploadProductImage = async(req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        // Convert buffer to data URL
        const fileBase64 = req.file.buffer.toString('base64');
        const fileDataUrl = `data:${req.file.mimetype};base64,${fileBase64}`;

        // Upload to Cloudinary
        const result = await uploadImage(fileDataUrl);

        res.status(200).json({
            url: result.url,
            publicId: result.public_id
        });
    } catch (error) {
        console.error('Error uploading product image:', error);
        res.status(500).json({
            message: 'Failed to upload image',
            error: error.message
        });
    }
};

/**
 * Bulk operations on products
 * @route POST /api/products/bulk
 * @access Private/Admin
 */
const bulkProductsOperation = async(req, res) => {
    try {
        const { operation, productIds, updateData } = req.body;

        if (!operation || !productIds || !Array.isArray(productIds) || productIds.length === 0) {
            return res.status(400).json({
                message: 'Operation type and product IDs array are required'
            });
        }

        let result;

        switch (operation) {
            case 'delete':
                // Find products to delete their images
                const productsToDelete = await Product.find({ _id: { $in: productIds } });
                let totalImagesDeleted = 0;

                // Delete images from Cloudinary
                for (const product of productsToDelete) {
                    const imagesToDelete = [];

                    // Check for images array with public_id property
                    if (product.images && product.images.length > 0) {
                        product.images.forEach(image => {
                            if (image.public_id) {
                                imagesToDelete.push(image.public_id);
                            }
                        });
                    }

                    // Check for imagePublicIds array (older format)
                    if (product.imagePublicIds && product.imagePublicIds.length > 0) {
                        product.imagePublicIds.forEach(publicId => {
                            if (publicId && !imagesToDelete.includes(publicId)) {
                                imagesToDelete.push(publicId);
                            }
                        });
                    }

                    // Delete all collected image IDs from Cloudinary
                    for (const publicId of imagesToDelete) {
                        try {
                            await deleteImage(publicId);
                            totalImagesDeleted++;
                            console.log(`Image ${publicId} deleted successfully from Cloudinary`);
                        } catch (err) {
                            console.error(`Failed to delete image ${publicId}:`, err);
                            // Continue with the process even if some images fail to delete
                        }
                    }
                }

                // Delete products
                result = await Product.deleteMany({ _id: { $in: productIds } });

                res.status(200).json({
                    message: `${result.deletedCount} products deleted successfully`,
                    imagesDeleted: totalImagesDeleted
                });
                break;

            case 'update':
                if (!updateData) {
                    return res.status(400).json({
                        message: 'Update data is required for update operation'
                    });
                }

                // Update products
                result = await Product.updateMany({ _id: { $in: productIds } }, { $set: updateData });

                res.status(200).json({
                    message: `${result.modifiedCount} products updated successfully`
                });
                break;

            default:
                return res.status(400).json({
                    message: 'Invalid operation type. Supported operations: delete, update'
                });
        }
    } catch (error) {
        console.error('Error performing bulk operation:', error);
        res.status(500).json({
            message: 'Failed to perform bulk operation',
            error: error.message
        });
    }
};

// Get product by ID
const getProductById = async(req, res) => {
    try {
        const { id } = req.params;

        // Check if ID is a valid MongoDB ObjectId
        if (!id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({ message: 'Invalid product ID format' });
        }

        const product = await Product.findById(id)
            .populate('category', 'name slug')
            .populate('brand', 'name slug');

        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        res.status(200).json({ product });
    } catch (error) {
        console.error('Error getting product by ID:', error);
        res.status(500).json({ message: 'Error fetching product', error: error.message });
    }
};

// Get products from the nearest warehouse within range
const getProductsByNearestWarehouse = async(req, res) => {
    try {
        const { lat, lng } = req.query;
        if (!lat || !lng) {
            return res.status(400).json({ message: 'Latitude and longitude are required' });
        }
        const warehouses = await Warehouse.find();
        let nearest = null;
        let minDistance = Infinity;
        for (const wh of warehouses) {
            const dist = getDistanceFromLatLonInKm(
                parseFloat(lat),
                parseFloat(lng),
                wh.coordinates.lat,
                wh.coordinates.lng
            );
            if (dist <= wh.rangeInKm && dist < minDistance) {
                minDistance = dist;
                nearest = wh;
            }
        }
        if (!nearest) {
            return res.status(404).json({ message: 'No warehouse found within range' });
        }
        // Find products available in this warehouse
        const products = await Product.find({ 'warehouses.warehouseId': nearest._id })
            .populate('category', 'name slug')
            .populate('brand', 'name slug');
        // Filter to only include stock > 0 in this warehouse
        const filtered = products.filter(p => {
            const whStock = p.warehouses.find(w => w.warehouseId.toString() === nearest._id.toString());
            return whStock && whStock.stock > 0;
        });
        res.json({ warehouse: nearest, products: filtered });
    } catch (err) {
        res.status(500).json({ message: 'Error finding nearest warehouse', error: err.message });
    }
};

// Export all functions
module.exports = {
    getAllProducts,
    getProductsByCategory,
    getProductBySlug,
    getProductById,
    getAllProductsAdmin,
    createProduct,
    updateProduct,
    deleteProduct,
    toggleProductVisibility,
    toggleFeatured,
    toggleTrending,
    uploadProductImage,
    bulkProductsOperation,
    getProductsByNearestWarehouse,
    // Aliases for backward compatibility
    getProducts: getAllProducts
};