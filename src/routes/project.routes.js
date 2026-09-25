const express = require('express');
const { body, param } = require('express-validator');
const controller = require('../controllers/project.controller');
const validate = require('../middleware/validate');
const authenticate = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);

router.get('/', controller.list);

router.post(
  '/',
  [
    body('name').trim().notEmpty().withMessage('Project name is required').isLength({ max: 120 }),
    body('description').optional({ nullable: true }).isString(),
  ],
  validate,
  controller.create
);

router.get('/:id', [param('id').isUUID().withMessage('Invalid project id')], validate, controller.getOne);

router.put(
  '/:id',
  [
    param('id').isUUID().withMessage('Invalid project id'),
    body('name').optional().trim().notEmpty().isLength({ max: 120 }),
    body('description').optional({ nullable: true }).isString(),
  ],
  validate,
  controller.update
);

router.delete('/:id', [param('id').isUUID().withMessage('Invalid project id')], validate, controller.remove);

module.exports = router;
