const express = require('express');
const reservationController = require('../controllers/reservationController');
const { verifyToken, authorize } = require('../middleware/auth');
const { ROLES } = require('../config/constants');

const router = express.Router();

router.get('/', verifyToken, reservationController.getReservations);
router.post('/', verifyToken, reservationController.createReservation);
router.put('/:id', verifyToken, authorize(ROLES.ADMIN, ROLES.MANAGER), reservationController.updateReservationStatus);
router.delete('/:id', verifyToken, authorize(ROLES.ADMIN, ROLES.MANAGER), reservationController.deleteReservation);

module.exports = router;
