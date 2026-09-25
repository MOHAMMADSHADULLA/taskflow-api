module.exports = (sequelize, DataTypes) => {
  const Task = sequelize.define(
    'Task',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      title: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: { notEmpty: true, len: [1, 200] },
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      status: {
        type: DataTypes.ENUM('todo', 'in_progress', 'done'),
        allowNull: false,
        defaultValue: 'todo',
      },
      priority: {
        type: DataTypes.ENUM('low', 'normal', 'high'),
        allowNull: false,
        defaultValue: 'normal',
      },
      dueDate: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },
      projectId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      assigneeId: {
        type: DataTypes.UUID,
        allowNull: true,
      },
    },
    {
      tableName: 'tasks',
      timestamps: true,
    }
  );

  Task.associate = (models) => {
    Task.belongsTo(models.Project, { foreignKey: 'projectId', as: 'project' });
    Task.belongsTo(models.User, { foreignKey: 'assigneeId', as: 'assignee' });
  };

  return Task;
};
