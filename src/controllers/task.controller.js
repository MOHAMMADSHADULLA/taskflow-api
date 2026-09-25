const { Task } = require('../models');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');
const { loadOwnedProject } = require('./project.controller');

async function loadOwnedTask(id, userId) {
  const task = await Task.findByPk(id, { include: { association: 'project' } });
  if (!task) throw new AppError('Task not found', 404);
  if (task.project.ownerId !== userId) throw new AppError('You do not have access to this task', 403);
  return task;
}

const listByProject = catchAsync(async (req, res) => {
  await loadOwnedProject(req.params.projectId, req.user.id);
  const tasks = await Task.findAll({
    where: { projectId: req.params.projectId },
    order: [['createdAt', 'DESC']],
  });
  res.json({ tasks });
});

const create = catchAsync(async (req, res) => {
  await loadOwnedProject(req.params.projectId, req.user.id);
  const { title, description, status, priority, dueDate, assigneeId } = req.body;
  const task = await Task.create({
    title,
    description,
    status,
    priority,
    dueDate,
    assigneeId,
    projectId: req.params.projectId,
  });
  res.status(201).json({ task });
});

const getOne = catchAsync(async (req, res) => {
  const task = await loadOwnedTask(req.params.id, req.user.id);
  res.json({ task });
});

const update = catchAsync(async (req, res) => {
  const task = await loadOwnedTask(req.params.id, req.user.id);
  const fields = ['title', 'description', 'status', 'priority', 'dueDate', 'assigneeId'];
  fields.forEach((field) => {
    if (req.body[field] !== undefined) task[field] = req.body[field];
  });
  await task.save();
  res.json({ task });
});

const remove = catchAsync(async (req, res) => {
  const task = await loadOwnedTask(req.params.id, req.user.id);
  await task.destroy();
  res.status(204).send();
});

module.exports = { listByProject, create, getOne, update, remove };
