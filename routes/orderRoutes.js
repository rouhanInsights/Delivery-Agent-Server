const express = require('express');
const router = express.Router();
const { getAssignedOrdersForDA, getOrderDetailsById, updateOrderStatus } = require('../controllers/orderController');

// GET /api/orders
router.get('/assigned/:da_id', getAssignedOrdersForDA);
router.get('/details/:order_id', getOrderDetailsById);
router.put('/status/:order_id', updateOrderStatus);


module.exports = router;
