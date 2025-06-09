const Warehouse = require('../models/Warehouse');
const Product = require('../models/Product');

// Create a new warehouse
exports.createWarehouse = async(req, res) => {
    try {
        const warehouse = new Warehouse(req.body);
        await warehouse.save();
        res.status(201).json(warehouse);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

// Get all warehouses
exports.getWarehouses = async(req, res) => {
    try {
        const warehouses = await Warehouse.find();
        res.json(warehouses);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Update a warehouse
exports.updateWarehouse = async(req, res) => {
    try {
        const warehouse = await Warehouse.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!warehouse) return res.status(404).json({ error: 'Warehouse not found' });
        res.json(warehouse);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

// Delete a warehouse
exports.deleteWarehouse = async(req, res) => {
    try {
        const warehouse = await Warehouse.findByIdAndDelete(req.params.id);
        if (!warehouse) return res.status(404).json({ error: 'Warehouse not found' });
        res.json({ message: 'Warehouse deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Get inventory for a warehouse
exports.getWarehouseInventory = async(req, res) => {
    try {
        const products = await Product.find({ 'warehouses.warehouseId': req.params.id });
        const inventory = products.map(product => {
            const warehouseStock = product.warehouses.find(w => w.warehouseId.toString() === req.params.id);
            return {
                productId: product._id,
                name: product.name,
                stock: warehouseStock ? warehouseStock.stock : 0
            };
        });
        res.json(inventory);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};