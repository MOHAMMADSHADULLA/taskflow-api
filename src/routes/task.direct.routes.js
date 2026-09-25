const express = require('express');
const { body, param } = require('express-validator');
const controller = require('../controllers/task.controller');
const validate = require('../middleware/validate');
const authenticate = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);

const idCheck = param('id').isUUID().withMessage('Invalid task id');

router.get('/:id', [idCheck], validate, controller.getOne);

router.put(
  '/:id',
  [
    idCheck,
    body('title').optional().trim().notEmpty().isLength({ max: 200 }),
    body('description').optional({ nullable: true }).isString(),
    body('status').optional().isIn(['todo', 'in_progress', 'done']),
    body('priority').optional().isIn(['low', 'normal', 'high']),
    body('dueDate').optional({ nullable: true }).isISO8601(),
    body('assigneeId').optional({ nullable: true }).isUUID(),
  ],
  validate,
  controller.update
);

router.delete('/:id', [idCheck], validate, controller.remove);

module.exports = router;
