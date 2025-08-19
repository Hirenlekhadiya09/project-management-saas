const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: [
        'task_assigned',
        'task_updated',
        'task_comment',
        'project_added',
        'project_updated',
        'user_invited',
        'user_joined'
      ],
      required: true
    },
    title: {
      type: String,
      required: true
    },
    message: {
      type: String,
      required: true
    },
    recipient: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: true
    },
    sender: {
      type: mongoose.Schema.ObjectId,
      ref: 'User'
    },
    read: {
      type: Boolean,
      default: false
    },
    relatedResource: {
      resourceType: {
        type: String,
        enum: ['task', 'project', 'user']
      },
      resourceId: {
        type: mongoose.Schema.ObjectId
      }
    },
    tenantId: {
      type: mongoose.Schema.ObjectId,
      ref: 'Tenant',
      required: true
    }
  },
  {
    timestamps: true
  }
);

// Create indexes
NotificationSchema.index({ recipient: 1, read: 1 });
NotificationSchema.index({ tenantId: 1 });

module.exports = mongoose.model('Notification', NotificationSchema);
