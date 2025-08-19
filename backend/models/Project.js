const mongoose = require('mongoose');

const ProjectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add a project name'],
      trim: true,
      maxlength: [100, 'Name cannot be more than 100 characters']
    },
    description: {
      type: String,
      required: [true, 'Please add a description'],
      maxlength: [500, 'Description cannot be more than 500 characters']
    },
    startDate: {
      type: Date,
      required: [true, 'Please add a start date']
    },
    endDate: {
      type: Date,
      required: [true, 'Please add an end date']
    },
    status: {
      type: String,
      enum: ['planning', 'active', 'completed', 'on-hold', 'cancelled'],
      default: 'planning'
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium'
    },
    tenantId: {
      type: mongoose.Schema.ObjectId,
      ref: 'Tenant',
      required: true
    },
    manager: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: true
    },
    members: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'User'
      }
    ],
    tags: [String]
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Create compound index on tenantId
ProjectSchema.index({ tenantId: 1, name: 1 });

// Cascade delete tasks when a project is deleted
ProjectSchema.pre('remove', async function (next) {
  await this.model('Task').deleteMany({ project: this._id });
  next();
});

// Reverse populate with virtuals
ProjectSchema.virtual('tasks', {
  ref: 'Task',
  localField: '_id',
  foreignField: 'project',
  justOne: false
});

module.exports = mongoose.model('Project', ProjectSchema);
