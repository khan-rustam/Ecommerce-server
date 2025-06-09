const express = require('express');
const router = express.Router();
const warehouseController = require('../controllers/warehouseController');

router.post('/', warehouseController.createWarehouse);
router.get('/', warehouseController.getWarehouses);
router.put('/:id', warehouseController.updateWarehouse);
router.delete('/:id', warehouseController.deleteWarehouse);
router.get('/:id/inventory', warehouseController.getWarehouseInventory);

// Pin code lookup (demo)
router.get('/../pincode/:code', (req, res) => {
    // For demo, use a static mapping or dummy coordinates
    const pinMap = {
        '110001': { lat: 28.6328, lng: 77.2197 }, // Connaught Place, Delhi
        '400001': { lat: 18.9388, lng: 72.8354 }, // Mumbai Fort
        '560001': { lat: 12.9766, lng: 77.5993 }, // Bangalore MG Road
    };
    const coords = pinMap[req.params.code];
    if (coords) {
        res.json(coords);
    } else {
        res.status(404).json({ error: 'Pin code not found' });
    }
});

module.exports = router;