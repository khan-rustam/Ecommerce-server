const express = require('express');
const router = express.Router();
const { getBrandSettings, updateBrandSettings } = require('../controllers/brandSettingsController');

router.get('/', getBrandSettings);
router.post('/', updateBrandSettings);

module.exports = router;