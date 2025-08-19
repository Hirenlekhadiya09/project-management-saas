const Project = require('../models/Project');
const User = require('../models/User');
const Notification = require('../models/Notification');

// @desc    Create new project
// @route   POST /api/projects
// @access  Private (Admin, Project Manager)
exports.createProject = async (req, res) => {
  try {
    // Add tenant ID from authenticated user
    req.body.tenantId = req.user.tenantId;
    
    // Set the manager to the current user if not specified
    if (!req.body.manager) {
      req.body.manager = req.user.id;
    }
    
    // Create project
    const project = await Project.create(req.body);

    // Notify users if they are added to the project
    if (req.body.members && req.body.members.length > 0) {
      const notifications = req.body.members.map(userId => ({
        type: 'project_added',
        title: 'Added to a new project',
        message: `You have been added to the project: ${project.name}`,
        recipient: userId,
        sender: req.user.id,
        relatedResource: {
          resourceType: 'project',
          resourceId: project._id
        },
        tenantId: req.user.tenantId
      }));

      await Notification.insertMany(notifications);
    }

    res.status(201).json({
      success: true,
      data: project
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get all projects
// @route   GET /api/projects
// @access  Private
exports.getProjects = async (req, res) => {
  try {
    let query;

    // Build query based on user role
    if (req.user.role === 'admin') {
      // Admins can see all projects for their tenant
      query = { tenantId: req.user.tenantId };
    } else if (req.user.role === 'project_manager') {
      // Project managers see projects they manage
      query = { 
        tenantId: req.user.tenantId,
        $or: [{ manager: req.user.id }, { members: req.user.id }]
      };
    } else {
      // Team members only see projects they're assigned to
      query = {
        tenantId: req.user.tenantId,
        members: req.user.id
      };
    }

    // Add filtering options
    if (req.query.status) {
      query.status = req.query.status;
    }

    if (req.query.priority) {
      query.priority = req.query.priority;
    }

    // Get projects with pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;

    const projects = await Project.find(query)
      .populate([
        { path: 'manager', select: 'name email avatar' },
        { path: 'members', select: 'name email avatar' }
      ])
      .skip(startIndex)
      .limit(limit)
      .sort({ createdAt: -1 });

    // Get total count for pagination
    const total = await Project.countDocuments(query);

    res.status(200).json({
      success: true,
      count: projects.length,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit)
      },
      data: projects
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get single project
// @route   GET /api/projects/:id
// @access  Private
exports.getProject = async (req, res) => {
  try {
    // Find project and populate with related data
    const project = await Project.findOne({
      _id: req.params.id,
      tenantId: req.user.tenantId
    }).populate([
      { path: 'manager', select: 'name email avatar' },
      { path: 'members', select: 'name email avatar' },
      { 
        path: 'tasks', 
        populate: { 
          path: 'assignedTo',
          select: 'name email avatar'
        } 
      }
    ]);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Check if user has access to this project
    if (
      req.user.role !== 'admin' && 
      project.manager.toString() !== req.user.id && 
      !project.members.some(member => member._id.toString() === req.user.id)
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this project'
      });
    }

    res.status(200).json({
      success: true,
      data: project
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Update project
// @route   PUT /api/projects/:id
// @access  Private (Admin, Project Manager)
exports.updateProject = async (req, res) => {
  try {
    let project = await Project.findOne({
      _id: req.params.id,
      tenantId: req.user.tenantId
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Check if user is authorized to update
    if (
      req.user.role !== 'admin' && 
      project.manager.toString() !== req.user.id
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this project'
      });
    }

    // Check for new members being added
    const newMembers = req.body.members
      ? req.body.members.filter(
          member => !project.members.includes(member)
        )
      : [];

    // Update project
    project = await Project.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    }).populate([
      { path: 'manager', select: 'name email avatar' },
      { path: 'members', select: 'name email avatar' }
    ]);

    // Notify new members
    if (newMembers.length > 0) {
      const notifications = newMembers.map(userId => ({
        type: 'project_added',
        title: 'Added to a project',
        message: `You have been added to the project: ${project.name}`,
        recipient: userId,
        sender: req.user.id,
        relatedResource: {
          resourceType: 'project',
          resourceId: project._id
        },
        tenantId: req.user.tenantId
      }));

      await Notification.insertMany(notifications);
    }

    res.status(200).json({
      success: true,
      data: project
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Delete project
// @route   DELETE /api/projects/:id
// @access  Private (Admin, Project Manager)
exports.deleteProject = async (req, res) => {
  try {
    const project = await Project.findOne({
      _id: req.params.id,
      tenantId: req.user.tenantId
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Check if user is authorized to delete
    if (
      req.user.role !== 'admin' && 
      project.manager.toString() !== req.user.id
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this project'
      });
    }

    await project.remove();

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
