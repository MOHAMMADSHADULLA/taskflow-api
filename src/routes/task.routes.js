const express = require('express');
const { body, param } = require('express-validator');
const controller = require('../controllers/task.controller');
const validate = require('../middleware/validate');
const authenticate = require('../middleware/auth');

// mergeParams so this router can read :projectId from the parent mount point
const router = express.Router({ mergeParams: true });

router.use(authenticate);

const projectIdCheck = param('projectId').isUUID().withMessage('Invalid project id');

router.get('/', [projectIdCheck], validate, controller.listByProject);

router.post(
  '/',
  [
    projectIdCheck,
    body('title').trim().notEmpty().withMessage('Title is required').isLength({ max: 200 }),
    body('description').optional({ nullable: true }).isString(),
    body('status').optional().isIn(['todo', 'in_progress', 'done']),
    body('priority').optional().isIn(['low', 'normal', 'high']),
    body('dueDate').optional({ nullable: true }).isISO8601().withMessage('dueDate must be YYYY-MM-DD'),
    body('assigneeId').optional({ nullable: true }).isUUID(),
  ],
  validate,
  controller.create
);

module.exports = router;
