const express = require('express');
const { verifyToken, authorize } = require('../middleware/auth');
const {
    getGuests,
    getGuest,
    createGuest,
    updateGuest,
    deleteGuest
} = require('../controllers/guestController');

const router = express.Router();

router.get('/', verifyToken, getGuests);
router.get('/:id', verifyToken, getGuest);
router.post('/', verifyToken, createGuest);
router.put('/:id', verifyToken, updateGuest);
router.delete('/:id', verifyToken, authorize('admin', 'manager'), deleteGuest);

module.exports = router;