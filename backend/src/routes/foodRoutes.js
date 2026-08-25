// const express = require('express');
// const { pool } = require('../config/db');
// const { verifyToken, authorize } = require('../middleware/auth');
// const FoodCategory = require('../models/FoodCategory');
// const FoodItem = require('../models/FoodItem');
// const FoodOrder = require('../models/FoodOrder');
// const Guest = require('../models/Guest');
// const { createNotification } = require('./notificationRoutes'); // ✅ Add this

// const router = express.Router();

// // ============================================
// // CATEGORIES
// // ============================================
// router.get('/categories', verifyToken, async (req, res) => {
//     try {
//         const categories = await FoodCategory.findAll();
//         res.json({ success: true, data: categories });
//     } catch (error) {
//         console.error('Error fetching categories:', error);
//         res.status(500).json({ success: false, message: 'Error fetching categories' });
//     }
// });

// router.post('/categories', verifyToken, authorize('admin', 'manager'), async (req, res) => {
//     try {
//         const { name, description } = req.body;
//         if (!name) return res.status(400).json({ success: false, message: 'Name is required' });
//         const category = await FoodCategory.create(name, description);
//         res.json({ success: true, data: category });
//     } catch (error) {
//         console.error('Error creating category:', error);
//         res.status(500).json({ success: false, message: 'Error creating category' });
//     }
// });

// router.put('/categories/:id', verifyToken, authorize('admin', 'manager'), async (req, res) => {
//     try {
//         const { name, description } = req.body;
//         const category = await FoodCategory.update(req.params.id, name, description);
//         if (!category) return res.status(404).json({ success: false, message: 'Category not found' });
//         res.json({ success: true, data: category });
//     } catch (error) {
//         console.error('Error updating category:', error);
//         res.status(500).json({ success: false, message: 'Error updating category' });
//     }
// });

// router.delete('/categories/:id', verifyToken, authorize('admin', 'manager'), async (req, res) => {
//     try {
//         const deleted = await FoodCategory.delete(req.params.id);
//         if (!deleted) return res.status(404).json({ success: false, message: 'Category not found' });
//         res.json({ success: true, message: 'Category deleted' });
//     } catch (error) {
//         console.error('Error deleting category:', error);
//         res.status(500).json({ success: false, message: 'Error deleting category' });
//     }
// });

// // ============================================
// // ITEMS
// // ============================================
// router.get('/items', verifyToken, async (req, res) => {
//     try {
//         const { categoryId } = req.query;
//         const items = await FoodItem.findAll(categoryId);
//         res.json({ success: true, data: items });
//     } catch (error) {
//         console.error('Error fetching items:', error);
//         res.status(500).json({ success: false, message: 'Error fetching items' });
//     }
// });

// router.post('/items', verifyToken, authorize('admin', 'manager'), async (req, res) => {
//     try {
//         const { category_id, name, description, price, is_available, image_url } = req.body;
//         if (!name || price === undefined) {
//             return res.status(400).json({ success: false, message: 'Name and price are required' });
//         }
//         const item = await FoodItem.create({ category_id, name, description, price, is_available, image_url });
//         res.json({ success: true, data: item });
//     } catch (error) {
//         console.error('Error creating item:', error);
//         res.status(500).json({ success: false, message: 'Error creating item' });
//     }
// });

// router.put('/items/:id', verifyToken, authorize('admin', 'manager'), async (req, res) => {
//     try {
//         const item = await FoodItem.update(req.params.id, req.body);
//         if (!item) return res.status(404).json({ success: false, message: 'Item not found' });
//         res.json({ success: true, data: item });
//     } catch (error) {
//         console.error('Error updating item:', error);
//         res.status(500).json({ success: false, message: 'Error updating item' });
//     }
// });

// router.delete('/items/:id', verifyToken, authorize('admin', 'manager'), async (req, res) => {
//     try {
//         const deleted = await FoodItem.delete(req.params.id);
//         if (!deleted) return res.status(404).json({ success: false, message: 'Item not found' });
//         res.json({ success: true, message: 'Item deleted' });
//     } catch (error) {
//         console.error('Error deleting item:', error);
//         res.status(500).json({ success: false, message: 'Error deleting item' });
//     }
// });

// // ============================================
// // ORDERS
// // ============================================
// router.get('/orders', verifyToken, async (req, res) => {
//     try {
//         const { status, guestId, startDate, endDate } = req.query;
//         const orders = await FoodOrder.findAll({ status, guestId, startDate, endDate });
//         res.json({ success: true, data: orders });
//     } catch (error) {
//         console.error('Error fetching orders:', error);
//         res.status(500).json({ success: false, message: 'Error fetching orders' });
//     }
// });

// router.get('/orders/:id', verifyToken, async (req, res) => {
//     try {
//         const order = await FoodOrder.findById(req.params.id);
//         if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
//         const items = await FoodOrder.findItems(req.params.id);
//         res.json({ success: true, data: { ...order, items } });
//     } catch (error) {
//         console.error('Error fetching order:', error);
//         res.status(500).json({ success: false, message: 'Error fetching order' });
//     }
// });

// router.post('/orders', verifyToken, async (req, res) => {
//     try {
//         const { reservation_id, guest_id, room_id, notes, items } = req.body;
        
//         let finalGuestId = guest_id;
//         if (req.user.role === 'guest') {
//             finalGuestId = req.user.id;
//         }
//         if (!finalGuestId) {
//             return res.status(400).json({ success: false, message: 'Guest ID is required' });
//         }
//         if (!items || !items.length) {
//             return res.status(400).json({ success: false, message: 'At least one item is required' });
//         }
        
//         const guest = await Guest.findById(finalGuestId);
//         if (!guest) {
//             return res.status(404).json({ success: false, message: 'Guest not found' });
//         }
        
//         let roomId = room_id;
//         if (!roomId && reservation_id) {
//             const [res] = await pool.execute('SELECT room_id FROM reservations WHERE id = ?', [reservation_id]);
//             if (res.length) roomId = res[0].room_id;
//         }
        
//         const orderData = {
//             reservation_id: reservation_id || null,
//             guest_id: finalGuestId,
//             room_id: roomId || null,
//             notes: notes || null,
//             created_by: req.user.role === 'guest' ? null : req.user.id,
//             items: items.map(item => ({
//                 food_item_id: item.food_item_id,
//                 quantity: item.quantity,
//                 unit_price: item.unit_price
//             }))
//         };
        
//         const order = await FoodOrder.create(orderData);
        
//         // ✅ Create notification for new food order
//         await createNotification(
//             req.user.id,
//             `New food order #${order.id} placed by ${guest.first_name} ${guest.last_name} for $${order.total_amount}`,
//             'food_order',
//             `/food/orders/${order.id}`
//         );

//         res.status(201).json({ success: true, data: order });
//     } catch (error) {
//         console.error('Error creating order:', error);
//         res.status(500).json({ success: false, message: 'Error creating order', error: error.message });
//     }
// });

// router.put('/orders/:id', verifyToken, authorize('admin', 'manager', 'receptionist'), async (req, res) => {
//     try {
//         const { status, notes } = req.body;
//         const updated = await FoodOrder.update(req.params.id, { status, notes });
//         if (!updated) return res.status(404).json({ success: false, message: 'Order not found' });
        
//         // ✅ Create notification for order status update
//         await createNotification(
//             req.user.id,
//             `Food order #${req.params.id} status updated to ${status}`,
//             'food_order',
//             `/food/orders/${req.params.id}`
//         );

//         res.json({ success: true, data: updated });
//     } catch (error) {
//         console.error('Error updating order:', error);
//         res.status(500).json({ success: false, message: 'Error updating order' });
//     }
// });

// router.delete('/orders/:id', verifyToken, authorize('admin', 'manager'), async (req, res) => {
//     try {
//         const deleted = await FoodOrder.delete(req.params.id);
//         if (!deleted) return res.status(404).json({ success: false, message: 'Order not found' });
        
//         // ✅ Create notification for cancelled order
//         await createNotification(
//             req.user.id,
//             `Food order #${req.params.id} cancelled`,
//             'food_order',
//             `/food/orders`
//         );

//         res.json({ success: true, message: 'Order cancelled' });
//     } catch (error) {
//         console.error('Error cancelling order:', error);
//         res.status(500).json({ success: false, message: 'Error cancelling order' });
//     }
// });

// // ============================================
// // FOOD STATS FOR DASHBOARD
// // ============================================
// router.get('/stats', verifyToken, async (req, res) => {
//     try {
//         const [totalOrders] = await pool.execute(
//             'SELECT COUNT(*) as total FROM food_orders'
//         );

//         const [totalRevenue] = await pool.execute(
//             'SELECT COALESCE(SUM(total_amount), 0) as total FROM food_orders WHERE status != "cancelled"'
//         );

//         const [monthlyRevenue] = await pool.execute(`
//             SELECT COALESCE(SUM(total_amount), 0) as total 
//             FROM food_orders 
//             WHERE status != "cancelled" 
//             AND MONTH(order_date) = MONTH(CURDATE()) 
//             AND YEAR(order_date) = YEAR(CURDATE())
//         `);

//         const [byStatus] = await pool.execute(`
//             SELECT status, COUNT(*) as count 
//             FROM food_orders 
//             GROUP BY status
//         `);

//         const [recentOrders] = await pool.execute(`
//             SELECT DATE(order_date) as date, COUNT(*) as count, SUM(total_amount) as revenue
//             FROM food_orders
//             WHERE order_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
//             GROUP BY DATE(order_date)
//             ORDER BY date ASC
//         `);

//         res.json({
//             success: true,
//             data: {
//                 totalOrders: totalOrders[0]?.total || 0,
//                 totalRevenue: totalRevenue[0]?.total || 0,
//                 monthlyRevenue: monthlyRevenue[0]?.total || 0,
//                 byStatus: byStatus || [],
//                 recentOrders: recentOrders || []
//             }
//         });
//     } catch (error) {
//         console.error('Error fetching food stats:', error);
//         res.status(500).json({ success: false, message: 'Error fetching food stats' });
//     }
// });

// module.exports = router;