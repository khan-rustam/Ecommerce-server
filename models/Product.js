const mongoose = require('mongoose');
const slugify = require('slugify');

const internationalPriceSchema = new mongoose.Schema({
    country: { type: String, required: true },
    currency: { type: String, required: true },
    price: { type: Number, required: true },
    salePrice: { type: Number, default: 0 },
    onSale: { type: Boolean, default: false }
}, { _id: false });

const productAttributeSchema = new mongoose.Schema({
    name: { type: String, required: true },
    value: { type: String, required: true }
}, { _id: false });

const ProductSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    slug: {
        type: String,
        unique: true,
        lowercase: true
    },
    description: {
        type: String,
        required: true,
        trim: true
    },
    shortDescription: {
        type: String
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    salePrice: {
        type: Number,
        min: 0,
        default: 0
    },
    // International prices
    foreignPrice: {
        type: Number,
        min: 0,
        default: 0
    },
    foreignSalePrice: {
        type: Number,
        min: 0,
        default: 0
    },
    currency: {
        type: String,
        default: '₹', // Default to Indian Rupee
    },
    foreignCurrency: {
        type: String,
        default: '$' // Default to USD
    },
    images: [{
        url: { type: String, required: true },
        alt: { type: String },
        isPrimary: { type: Boolean, default: false },
        public_id: { type: String }
    }],
    imagePublicIds: [{
        type: String
    }],
    extraImages: [{
        url: String,
        publicId: String
    }],
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: true
    },
    brand: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Brand',
        required: true
    },
    stock: {
        type: Number,
        required: true,
        min: 0,
        default: 0
    },
    stockStatus: {
        type: String,
        enum: ['in_stock', 'out_of_stock', 'on_backorder', 'discontinued'],
        default: 'in_stock'
    },
    isHidden: {
        type: Boolean,
        default: false
    },
    isFeatured: {
        type: Boolean,
        default: false
    },
    isNew: {
        type: Boolean,
        default: true
    },
    isTrending: {
        type: Boolean,
        default: false
    },
    onSale: {
        type: Boolean,
        default: false
    },
    readyToShip: {
        type: Boolean,
        default: true
    },
    sellInOtherCountries: {
        type: Boolean,
        default: false
    },
    allowReviews: {
        type: Boolean,
        default: true
    },
    allowCashOnDelivery: {
        type: Boolean,
        default: true
    },
    rating: {
        type: Number,
        min: 0,
        max: 5,
        default: 0
    },
    numReviews: {
        type: Number,
        default: 0
    },
    tags: [{
        type: String
    }],
    purchaseNote: {
        type: String,
        default: ''
    },
    hsnCode: {
        type: String,
        default: ''
    },
    gstRate: {
        sgst: {
            type: Number,
            default: 0
        },
        cgst: {
            type: Number,
            default: 0
        },
        igst: {
            type: Number,
            default: 0
        }
    },
    madeIn: {
        type: String,
        default: 'India'
    },
    dimensions: {
        length: Number,
        width: Number,
        height: Number,
        unit: {
            type: String,
            default: 'cm'
        }
    },
    weight: {
        value: Number,
        unit: {
            type: String,
            default: 'g'
        }
    },
    productType: {
        type: String,
        enum: ['Simple', 'Variable', 'Grouped', 'External'],
        default: 'Simple'
    },
    isRenewable: {
        type: Boolean,
        default: false
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    internationalPrices: [internationalPriceSchema],
    taxClass: { type: String, default: 'standard' },
    taxStatus: { type: String, enum: ['taxable', 'shipping', 'none'], default: 'taxable' },
    subCategories: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category'
    }],
    sku: { type: String, unique: true, sparse: true },
    barcode: { type: String, unique: true, sparse: true },
    manageStock: { type: Boolean, default: true },
    stockQuantity: { type: Number, default: 0 },
    backorderAllowed: { type: Boolean, default: false },
    lowStockThreshold: { type: Number, default: 5 },
    shippingClass: { type: String, default: 'standard' },
    requiresShipping: { type: Boolean, default: true },
    attributes: [productAttributeSchema],
    status: {
        type: String,
        enum: ['draft', 'published', 'archived'],
        default: 'draft'
    },
    visibility: {
        type: String,
        enum: ['visible', 'catalog', 'search', 'hidden'],
        default: 'visible'
    },
    isDigital: { type: Boolean, default: false },
    digitalFile: { type: String },
    downloadLimit: { type: Number, default: -1 }, // -1 = unlimited
    downloadExpiry: { type: Number, default: -1 }, // -1 = never expires (in days)
    metaTitle: { type: String },
    metaDescription: { type: String },
    metaKeywords: [{ type: String }],
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

// Create slug from name before saving
ProductSchema.pre('save', function(next) {
    if (this.isModified('name')) {
        this.slug = slugify(this.name, { lower: true, strict: true });
    }
    next();
});

// Add text index for search functionality
ProductSchema.index({
    name: 'text',
    description: 'text',
    shortDescription: 'text',
    'attributes.value': 'text'
});

module.exports = mongoose.model('Product', ProductSchema);