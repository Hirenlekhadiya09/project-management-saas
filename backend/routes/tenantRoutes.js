const express = require('express');
const { getTenants } = require('../controllers/tenantController');

const router = express.Router();

router.route('/').get(getTenants);

module.exports = router;
