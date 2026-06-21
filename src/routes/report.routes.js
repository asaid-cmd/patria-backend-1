const express = require('express');
const reportController = require('../controllers/reportController');
const { verifyToken, authorize } = require('../middleware/auth');
const { ROLES } = require('../config/constants');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Reports
 *   description: Business reports and analytics
 */

/**
 * @swagger
 * /reports/overview:
 *   get:
 *     summary: Get business overview report
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for the report
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for the report
 *     responses:
 *       200:
 *         description: Overview report retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - requires ADMIN, MANAGER, or SUPER_ADMIN role
 */
router.get('/overview', verifyToken, authorize(ROLES.ADMIN, ROLES.MANAGER, ROLES.SUPER_ADMIN), reportController.getOverviewReport);

/**
 * @swagger
 * /reports/employees:
 *   get:
 *     summary: Get employee performance report
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for the report
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for the report
 *       - in: query
 *         name: locationId
 *         schema:
 *           type: string
 *         description: Filter by location ID
 *     responses:
 *       200:
 *         description: Employee report retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - requires ADMIN, MANAGER, or SUPER_ADMIN role
 */
router.get('/employees', verifyToken, authorize(ROLES.ADMIN, ROLES.MANAGER, ROLES.SUPER_ADMIN), reportController.getEmployeeReport);

/**
 * @swagger
 * /reports/branches:
 *   get:
 *     summary: Get branch performance report
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for the report
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for the report
 *     responses:
 *       200:
 *         description: Branch report retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - requires ADMIN, MANAGER, or SUPER_ADMIN role
 */
router.get('/branches', verifyToken, authorize(ROLES.ADMIN, ROLES.MANAGER, ROLES.SUPER_ADMIN), reportController.getBranchReport);

/**
 * @swagger
 * /reports/analytics:
 *   get:
 *     summary: Get detailed analytics data
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for analytics
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for analytics
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [sales, orders, customers, products]
 *         description: Type of analytics to retrieve
 *     responses:
 *       200:
 *         description: Analytics data retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - requires ADMIN, MANAGER, or SUPER_ADMIN role
 */
router.get('/analytics', verifyToken, authorize(ROLES.ADMIN, ROLES.MANAGER, ROLES.SUPER_ADMIN), reportController.getAnalytics);

/**
 * @swagger
 * /reports/export:
 *   get:
 *     summary: Export report data
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [orders, customers, products, financial]
 *         required: true
 *         description: Type of data to export
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [csv, xlsx, pdf]
 *         description: Export format
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for export
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for export
 *     responses:
 *       200:
 *         description: Data exported successfully
 *       400:
 *         description: Invalid export parameters
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - requires ADMIN, MANAGER, or SUPER_ADMIN role
 */
router.get('/export', verifyToken, authorize(ROLES.ADMIN, ROLES.MANAGER, ROLES.SUPER_ADMIN), reportController.exportData);

module.exports = router;
