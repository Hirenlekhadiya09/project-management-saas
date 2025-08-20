const Task = require('../models/Task');
const Project = require('../models/Project');
const User = require('../models/User');
const Notification = require('../models/Notification');

// @desc    Create new task
// @route   POST /api/tasks
// @access  Private
exports.createTask = async (req, res) => {
  try {
    // Log request body for debugging
    console.log('Task create request body:', JSON.stringify(req.body));
    
    // Add tenant ID from authenticated user
    req.body.tenantId = req.user.tenantId;
    
    // Set the creator to the current user
    req.body.createdBy = req.user.id;
    
    // Check if project exists and user has access
    const project = await Project.findOne({
      _id: req.body.project,
      tenantId: req.user.tenantId
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Check if user is authorized to create task in this project
    const isProjectMember = project.members.some(
      member => member.toString() === req.user.id
    );
    
    if (
      req.user.role !== 'admin' && 
      project.manager.toString() !== req.user.id && 
      !isProjectMember
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to create tasks in this project'
      });
    }

    // Create task
    const task = await Task.create(req.body);

    // Notify assigned user if any
    if (req.body.assignedTo) {
      await Notification.create({
        type: 'task_assigned',
        title: 'New task assigned',
        message: `You have been assigned to task: ${task.title}`,
        recipient: req.body.assignedTo,
        sender: req.user.id,
        relatedResource: {
          resourceType: 'task',
          resourceId: task._id
        },
        tenantId: req.user.tenantId
      });
    }

    // Populate task with user data
    const populatedTask = await Task.findById(task._id)
      .populate([
        { path: 'assignedTo', select: 'name email avatar' },
        { path: 'createdBy', select: 'name email avatar' }
      ]);

    res.status(201).json({
      success: true,
      data: populatedTask
    });
  } catch (error) {
    console.error('Task creation error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get all tasks
// @route   GET /api/tasks
// @access  Private
exports.getTasks = async (req, res) => {
  try {
    let query = { tenantId: req.user.tenantId };

    // Build query based on request parameters
    if (req.query.project) {
      query.project = req.query.project;
    }

    if (req.query.status) {
      query.status = req.query.status;
    }

    if (req.query.priority) {
      query.priority = req.query.priority;
    }

    if (req.query.assignedTo) {
      query.assignedTo = req.query.assignedTo;
    } else if (req.query.myTasks) {
      // Only get tasks assigned to current user
      query.assignedTo = req.user.id;
    }

    // Get tasks with pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const startIndex = (page - 1) * limit;

    const tasks = await Task.find(query)
      .populate([
        { path: 'project', select: 'name status' },
        { path: 'assignedTo', select: 'name email avatar' },
        { path: 'createdBy', select: 'name email avatar' },
        { 
          path: 'comments.user',
          select: 'name email avatar'
        }
      ])
      .skip(startIndex)
      .limit(limit)
      .sort({ createdAt: -1 });

    // Get total count for pagination
    const total = await Task.countDocuments(query);

    res.status(200).json({
      success: true,
      count: tasks.length,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit)
      },
      data: tasks
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get single task
// @route   GET /api/tasks/:id
// @access  Private
exports.getTask = async (req, res) => {
  try {
    const task = await Task.findOne({
      _id: req.params.id,
      tenantId: req.user.tenantId
    }).populate([
      { path: 'project', select: 'name status' },
      { path: 'assignedTo', select: 'name email avatar' },
      { path: 'createdBy', select: 'name email avatar' },
      { 
        path: 'comments.user',
        select: 'name email avatar'
      }
    ]);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Check if user has access to the task's project
    const project = await Project.findById(task.project._id);
    
    const isProjectMember = project.members.some(
      member => member.toString() === req.user.id
    );
    
    if (
      req.user.role !== 'admin' && 
      project.manager.toString() !== req.user.id && 
      !isProjectMember &&
      task.assignedTo?._id.toString() !== req.user.id
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this task'
      });
    }

    res.status(200).json({
      success: true,
      data: task
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Update task
// @route   PUT /api/tasks/:id
// @access  Private
exports.updateTask = async (req, res) => {
  try {
    let task = await Task.findOne({
      _id: req.params.id,
      tenantId: req.user.tenantId
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Check if user has permission to update
    const project = await Project.findById(task.project);
    
    const isProjectMember = project.members.some(
      member => member.toString() === req.user.id
    );
    
    if (
      req.user.role !== 'admin' && 
      project.manager.toString() !== req.user.id && 
      !isProjectMember &&
      task.assignedTo?.toString() !== req.user.id
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this task'
      });
    }

    // Check if assigned user is being changed
    const newAssignee = req.body.assignedTo && 
                       (!task.assignedTo || 
                        task.assignedTo.toString() !== req.body.assignedTo);

    // Update task
    task = await Task.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    }).populate([
      { path: 'project', select: 'name status' },
      { path: 'assignedTo', select: 'name email avatar' },
      { path: 'createdBy', select: 'name email avatar' }
    ]);

    // If task was assigned to a new user, create notification
    if (newAssignee) {
      await Notification.create({
        type: 'task_assigned',
        title: 'Task assigned to you',
        message: `You have been assigned to task: ${task.title}`,
        recipient: req.body.assignedTo,
        sender: req.user.id,
        relatedResource: {
          resourceType: 'task',
          resourceId: task._id
        },
        tenantId: req.user.tenantId
      });
    } 
    // If task status changed, notify assigned user (if not the updater)
    else if (
      req.body.status && 
      task.assignedTo && 
      task.assignedTo._id.toString() !== req.user.id
    ) {
      await Notification.create({
        type: 'task_updated',
        title: 'Task status updated',
        message: `Task "${task.title}" status changed to ${req.body.status}`,
        recipient: task.assignedTo._id,
        sender: req.user.id,
        relatedResource: {
          resourceType: 'task',
          resourceId: task._id
        },
        tenantId: req.user.tenantId
      });
    }

    res.status(200).json({
      success: true,
      data: task
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Delete task
// @route   DELETE /api/tasks/:id
// @access  Private
exports.deleteTask = async (req, res) => {
  try {
    const task = await Task.findOne({
      _id: req.params.id,
      tenantId: req.user.tenantId
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Check if user has permission to delete
    const project = await Project.findById(task.project);
    
    if (
      req.user.role !== 'admin' && 
      project.manager.toString() !== req.user.id && 
      task.createdBy.toString() !== req.user.id
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this task'
      });
    }

    await Task.deleteOne({ _id: task._id });

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Add comment to task
// @route   POST /api/tasks/:id/comments
// @access  Private
exports.addComment = async (req, res) => {
  try {
    const task = await Task.findOne({
      _id: req.params.id,
      tenantId: req.user.tenantId
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Check if user has access to the task's project
    const project = await Project.findById(task.project);
    
    const isProjectMember = project.members.some(
      member => member.toString() === req.user.id
    );
    
    if (
      req.user.role !== 'admin' && 
      project.manager.toString() !== req.user.id && 
      !isProjectMember
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to comment on this task'
      });
    }

    // Add comment
    const comment = {
      text: req.body.text,
      user: req.user.id
    };

    task.comments.unshift(comment);
    await task.save();

    // Populate comments with user info
    const updatedTask = await Task.findById(task._id).populate({
      path: 'comments.user',
      select: 'name email avatar'
    });

    // Notify task assignee if it's not the commenter
    if (
      task.assignedTo && 
      task.assignedTo.toString() !== req.user.id
    ) {
      await Notification.create({
        type: 'task_comment',
        title: 'New comment on your task',
        message: `New comment on task: ${task.title}`,
        recipient: task.assignedTo,
        sender: req.user.id,
        relatedResource: {
          resourceType: 'task',
          resourceId: task._id
        },
        tenantId: req.user.tenantId
      });
    }

    res.status(200).json({
      success: true,
      data: updatedTask.comments[0]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};
