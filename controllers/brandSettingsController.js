const BrandSettings = require('../models/BrandSettings');

// Get current brand settings
exports.getBrandSettings = async(req, res) => {
    try {
        let settings = await BrandSettings.findOne();
        if (!settings) {
            // Default to first palette if not set
            settings = await BrandSettings.create({ paletteName: 'Sunset Orange', primary: '#ff6600', secondary: '#ffb347', accent: '#ffecd2' });
        }
        res.json(settings);
    } catch (err) {
        res.status(500).json({ msg: 'Failed to fetch brand settings', error: err.message });
    }
};

// Update brand settings
exports.updateBrandSettings = async(req, res) => {
    const { paletteName, primary, secondary, accent } = req.body;
    try {
        let settings = await BrandSettings.findOne();
        if (!settings) {
            settings = new BrandSettings();
        }
        settings.paletteName = paletteName;
        if (primary) settings.primary = primary;
        if (secondary) settings.secondary = secondary;
        if (accent) settings.accent = accent;
        await settings.save();
        res.json({ msg: 'Brand settings updated', settings });
    } catch (err) {
        res.status(500).json({ msg: 'Failed to update brand settings', error: err.message });
    }
};