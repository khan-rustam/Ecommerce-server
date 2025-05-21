const Blog = require('../models/Blog');
const cloudinary = require('cloudinary').v2;
const { Readable } = require('stream');

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Get all blogs (public)
exports.getAllBlogs = async(req, res) => {
    try {
        const blogs = await Blog.find({ isPublished: true })
            .sort({ createdAt: -1 })
            .populate('author', 'name');
        res.status(200).json(blogs);
    } catch (error) {
        console.error('Error fetching blogs:', error);
        res.status(500).json({ message: 'Error fetching blogs', error: error.message });
    }
};

// Get all blogs (admin)
exports.getAllBlogsAdmin = async(req, res) => {
    try {
        const blogs = await Blog.find()
            .sort({ createdAt: -1 })
            .populate('author', 'name');
        res.status(200).json(blogs);
    } catch (error) {
        console.error('Error fetching blogs:', error);
        res.status(500).json({ message: 'Error fetching blogs', error: error.message });
    }
};

// Get a single blog by ID or slug
exports.getBlogByIdOrSlug = async(req, res) => {
    try {
        let blog;
        const { identifier } = req.params;

        // Check if the identifier is a valid ObjectId
        if (identifier.match(/^[0-9a-fA-F]{24}$/)) {
            blog = await Blog.findById(identifier).populate('author', 'name');
        } else {
            // If not an ObjectId, try to find by slug
            blog = await Blog.findOne({ slug: identifier }).populate('author', 'name');
        }

        if (!blog) {
            return res.status(404).json({ message: 'Blog not found' });
        }

        // Increment view count if this is a public view
        if (blog.isPublished && req.query.countView === 'true') {
            blog.views += 1;
            await blog.save();
        }

        res.status(200).json(blog);
    } catch (error) {
        console.error('Error fetching blog:', error);
        res.status(500).json({ message: 'Error fetching blog', error: error.message });
    }
};

// Create blog
exports.createBlog = async(req, res) => {
    try {
        const {
            title,
            content,
            image,
            imagePublicId,
            isPublished,
            tags
        } = req.body;

        const blog = new Blog({
            title,
            content,
            image,
            imagePublicId,
            author: req.user._id,
            isPublished: isPublished !== undefined ? isPublished : false,
            tags: tags || []
        });

        await blog.save();
        res.status(201).json(blog);
    } catch (error) {
        console.error('Error creating blog:', error);
        res.status(500).json({ message: 'Error creating blog', error: error.message });
    }
};

// Update blog
exports.updateBlog = async(req, res) => {
    try {
        const {
            title,
            content,
            image,
            imagePublicId,
            isPublished,
            tags
        } = req.body;

        const blog = await Blog.findById(req.params.id);
        if (!blog) {
            return res.status(404).json({ message: 'Blog not found' });
        }

        // Check if user has permission (admin or author)
        if (blog.author.toString() !== req.user._id.toString() && !req.user.isAdmin) {
            return res.status(403).json({ message: 'You do not have permission to update this blog' });
        }

        // If image is changed, delete the old image from Cloudinary
        if (imagePublicId && imagePublicId !== blog.imagePublicId && blog.imagePublicId) {
            try {
                await cloudinary.uploader.destroy(blog.imagePublicId);
                console.log(`Previous image ${blog.imagePublicId} deleted successfully`);
            } catch (cloudinaryError) {
                console.error('Error deleting previous image from Cloudinary:', cloudinaryError);
            }
        }

        // Update fields if they are provided
        if (title !== undefined) blog.title = title;
        if (content !== undefined) blog.content = content;
        if (image !== undefined) blog.image = image;
        if (imagePublicId !== undefined) blog.imagePublicId = imagePublicId;
        if (isPublished !== undefined) blog.isPublished = isPublished;
        if (tags !== undefined) blog.tags = tags;

        await blog.save();
        res.status(200).json(blog);
    } catch (error) {
        console.error('Error updating blog:', error);
        res.status(500).json({ message: 'Error updating blog', error: error.message });
    }
};

// Delete blog
exports.deleteBlog = async(req, res) => {
    try {
        const blog = await Blog.findById(req.params.id);

        if (!blog) {
            return res.status(404).json({ message: 'Blog not found' });
        }

        // Check if user has permission (admin or author)
        if (blog.author.toString() !== req.user._id.toString() && !req.user.isAdmin) {
            return res.status(403).json({ message: 'You do not have permission to delete this blog' });
        }

        // Delete image from Cloudinary if it exists
        if (blog.imagePublicId) {
            try {
                await cloudinary.uploader.destroy(blog.imagePublicId);
                console.log(`Image ${blog.imagePublicId} deleted successfully`);
            } catch (cloudinaryError) {
                console.error('Error deleting image from Cloudinary:', cloudinaryError);
            }
        }

        await Blog.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: 'Blog deleted successfully' });
    } catch (error) {
        console.error('Error deleting blog:', error);
        res.status(500).json({ message: 'Error deleting blog', error: error.message });
    }
};

// Toggle blog published status
exports.togglePublished = async(req, res) => {
    try {
        const blog = await Blog.findById(req.params.id);

        if (!blog) {
            return res.status(404).json({ message: 'Blog not found' });
        }

        // Check if user has permission (admin or author)
        if (blog.author.toString() !== req.user._id.toString() && !req.user.isAdmin) {
            return res.status(403).json({ message: 'You do not have permission to update this blog' });
        }

        blog.isPublished = !blog.isPublished;
        await blog.save();

        res.status(200).json(blog);
    } catch (error) {
        console.error('Error toggling blog published status:', error);
        res.status(500).json({ message: 'Error toggling blog status', error: error.message });
    }
};

// Upload blog image
exports.uploadImage = async(req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        // Create a buffer stream from the file buffer
        const stream = Readable.from(req.file.buffer);

        // Get current date to create dynamic folders
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0'); // 01-12

        // Get the author ID for user-specific subfolders
        const authorId = req.user._id.toString();

        // Creating folder structure: blogs/year/month/userId/
        const folderPath = `blogs/${year}/${month}/${authorId}`;

        // Set a unique public_id with timestamp to prevent conflicts
        const timestamp = Math.floor(Date.now() / 1000);
        const fileName = `blog_${timestamp}_${Math.random().toString(36).substring(2, 10)}`;

        // Create a promise to handle the Cloudinary upload
        const uploadPromise = new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream({
                    folder: folderPath,
                    public_id: fileName,
                    resource_type: 'image',
                    transformation: [
                        { width: 1920, crop: "limit" }, // Limit width to 1920px max
                        { quality: "auto:good" }, // Automatic quality optimization
                        { fetch_format: "auto" }, // Automatic format selection (webp when supported)
                        { dpr: "auto" }, // Automatic device pixel ratio
                    ],
                    eager: [
                        // Create optimized thumbnails for different use cases
                        { width: 400, height: 300, crop: "fill", gravity: "auto" }, // Thumbnail
                        { width: 800, height: 450, crop: "fill", gravity: "auto" }, // Blog list view
                    ],
                    eager_async: true, // Process transformations asynchronously
                    tags: ['blog_image', req.user._id.toString()], // Add tags for better organization
                    overwrite: true, // Overwrite if same public_id exists
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

        // Log successful upload
        console.log(`Image uploaded successfully: ${uploadResult.public_id}`);

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