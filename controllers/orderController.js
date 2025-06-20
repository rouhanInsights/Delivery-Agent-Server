const pool = require('../config/db');

// GET assigned orders for a delivery agent
const getAssignedOrdersForDA = async (req, res) => {
  const { da_id } = req.params;

  try {
    const result = await pool.query(`
      SELECT
        o.order_id,
        TO_CHAR(o.order_date, 'Mon DD YYYY') AS formatted_date,
        s.slot_details,
        dao.order_status AS status,
        u.name AS customer_name,
        u.phone,
        CONCAT_WS(', ',
          a.address_line1,
          a.address_line2,
          a.city,
          a.state,
          a.pincode
        ) AS full_address,
        COUNT(oi.order_item_id) AS total_items,
        SUM(oi.price * oi.quantity) AS total_price,
        o.payment_method
      FROM cust_orders o
      JOIN da_assigned_order dao ON dao.assigned_order_id = o.order_id
      JOIN cust_users u ON o.user_id = u.user_id
      JOIN cust_addresses a ON o.address_id = a.address_id
      JOIN cust_slot_details s ON o.slot_id = s.slot_id
      JOIN cust_order_items oi ON o.order_id = oi.order_id
      WHERE dao.da_id = $1
      GROUP BY o.order_id, s.slot_details, dao.order_status, u.name, u.phone,
               a.address_line1, a.address_line2, a.city, a.state, a.pincode,
               o.payment_method, o.order_date
      ORDER BY o.order_date DESC;
    `, [da_id]);

    res.status(200).json({ orders: result.rows });
  } catch (err) {
    console.error('Error fetching assigned orders:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// GET full order details by ID
const getOrderDetailsById = async (req, res) => {
  const { order_id } = req.params;

  try {
    const result = await pool.query(`
      SELECT
        o.order_id,
        o.payment_method,
        TO_CHAR(o.order_date, 'Mon DD YYYY') AS formatted_date,
        u.name AS customer_name,
        u.phone,
        CONCAT_WS(', ', a.address_line1, a.address_line2, a.city, a.state, a.pincode) AS full_address,
        s.slot_details,
        dao.order_status,
        p.name AS item_name,
        oi.quantity,
        oi.price,
        (oi.quantity * oi.price) AS item_total
      FROM cust_orders o
      JOIN cust_order_items oi ON o.order_id = oi.order_id
      JOIN cust_products p ON oi.product_id = p.product_id
      JOIN cust_users u ON o.user_id = u.user_id
      JOIN cust_addresses a ON o.address_id = a.address_id
      JOIN cust_slot_details s ON o.slot_id = s.slot_id
      JOIN da_assigned_order dao ON dao.assigned_order_id = o.order_id
      WHERE o.order_id = $1
    `, [order_id]);

    res.status(200).json({ orderDetails: result.rows });
  } catch (err) {
    console.error('Error fetching order details:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// PUT update order status
// PUT update order status
const updateOrderStatus = async (req, res) => {
  const { order_id } = req.params;
  let { status, remarks, delivered_at } = req.body;

  // Fallback remarks if not provided
  const remarksToSave = remarks && remarks.trim() !== ''
    ? remarks
    : (status === 'delivered' ? 'Delivered successfully' : null);

  console.log("Incoming update:", { order_id, status, remarks: remarksToSave, delivered_at });

  try {
    let query;
    let values;

    if (status === 'delivered' && delivered_at) {
      query = `
        UPDATE da_assigned_order
        SET order_status = $1,
            remarks = $2,
            delivered_at = $3
        WHERE assigned_order_id = $4
        RETURNING *;
      `;
      values = [status, remarksToSave, delivered_at, order_id];
    } else {
      query = `
        UPDATE da_assigned_order
        SET order_status = $1,
            remarks = $2
        WHERE assigned_order_id = $3
        RETURNING *;
      `;
      values = [status, remarksToSave, order_id];
    }

    const result = await pool.query(query, values);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.status(200).json({ message: 'Order updated', order: result.rows[0] });
  } catch (err) {
    console.error('Order update error:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
};


module.exports = {
  getAssignedOrdersForDA,
  updateOrderStatus,
  getOrderDetailsById
};
