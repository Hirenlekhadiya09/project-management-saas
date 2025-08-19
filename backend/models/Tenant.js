const mongoose = require('mongoose');

const TenantSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add a tenant name'],
      trim: true,
      maxlength: [50, 'Name cannot be more than 50 characters']
    },
    slug: {
      type: String,
      unique: true,
      required: true,
      lowercase: true
    },
    logo: {
      type: String,
      default: 'default-tenant-logo.png'
    },
    owner: {
      type: mongoose.Schema.ObjectId,
      ref: 'User'
    },
    plan: {
      type: String,
      enum: ['free', 'pro', 'enterprise'],
      default: 'free'
    },
    customDomain: {
      type: String
    },
    maxUsers: {
      type: Number,
      default: 5 // For free plan
    },
    active: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

// Create index for slug
TenantSchema.index({ slug: 1 });

module.exports = mongoose.model('Tenant', TenantSchema);
