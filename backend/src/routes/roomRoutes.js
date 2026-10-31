const express = require('express');
const { verifyToken, authorize } = require('../middleware/auth');
const {
    getRooms,
    getStatusBoard,
    getRoomTypes,
    getRoom,
    createRoom,
    updateRoom,
    deleteRoom
} = require('../controllers/roomController');

const router = express.Router();

// Specific paths must be declared BEFORE '/:id', otherwise ':id' would swallow them
router.get('/', verifyToken, getRooms);
router.get('/status-board', verifyToken, getStatusBoard);
router.get('/types/all', verifyToken, getRoomTypes);
router.get('/:id', verifyToken, getRoom);

router.post('/', verifyToken, authorize('admin', 'manager'), createRoom);
router.put('/:id', verifyToken, authorize('admin', 'manager'), updateRoom);
router.delete('/:id', verifyToken, authorize('admin'), deleteRoom);

module.exports = router;