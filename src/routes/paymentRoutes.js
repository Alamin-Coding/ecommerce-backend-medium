const express = require('express');
const router = express.Router();

// Placeholder payment routes - replace with actual payment controller logic
router.get('/', (req, res) => {
	res.json({ message: 'Payments route' });
});

module.exports = router;
