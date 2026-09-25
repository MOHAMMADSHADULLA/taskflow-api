const { Project } = require('../models');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');

async function loadOwnedProject(id, userId) {
  const project = await Project.findByPk(id);
  if (!project) throw new AppError('Project not found', 404);
  if (project.ownerId !== userId) throw new AppError('You do not have access to this project', 403);
  return project;
}

const list = catchAsync(async (req, res) => {
  const projects = await Project.findAll({
    where: { ownerId: req.user.id },
    order: [['createdAt', 'DESC']],
  });
  res.json({ projects });
});

const create = catchAsync(async (req, res) => {
  const { name, description } = req.body;
  const project = await Project.create({ name, description, ownerId: req.user.id });
  res.status(201).json({ project });
});

const getOne = catchAsync(async (req, res) => {
  const project = await loadOwnedProject(req.params.id, req.user.id);
  res.json({ project });
});

const update = catchAsync(async (req, res) => {
  const project = await loadOwnedProject(req.params.id, req.user.id);
  const { name, description } = req.body;
  if (name !== undefined) project.name = name;
  if (description !== undefined) project.description = description;
  await project.save();
  res.json({ project });
});

const remove = catchAsync(async (req, res) => {
  const project = await loadOwnedProject(req.params.id, req.user.id);
  await project.destroy();
  res.status(204).send();
});

module.exports = { list, create, getOne, update, remove, loadOwnedProject };
