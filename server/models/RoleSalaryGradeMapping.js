import mongoose from "mongoose";

const roleSalaryGradeMappingSchema = new mongoose.Schema(
  {
    role: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Role",
      required: true,
      unique: true, 
    },
    salaryGrade: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SalaryGrade",
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
roleSalaryGradeMappingSchema.index({ role: 1 });
roleSalaryGradeMappingSchema.index({ salaryGrade: 1 });
roleSalaryGradeMappingSchema.index({ isActive: 1 });

// Static method to get salary grade for a role
roleSalaryGradeMappingSchema.statics.getSalaryGradeForRole = function (roleId) {
  return this.findOne({ role: roleId, isActive: true }).populate("salaryGrade");
};

// Static method to get all active mappings
roleSalaryGradeMappingSchema.statics.getActiveMappings = function () {
  return this.find({ isActive: true })
    .populate("role", "name level description")
    .populate(
      "salaryGrade",
      "grade name minGrossSalary maxGrossSalary description"
    )
    .sort({ "role.level": -1 });
};

// Static method to check if role has salary grade mapping
roleSalaryGradeMappingSchema.statics.hasMapping = function (roleId) {
  return this.exists({ role: roleId, isActive: true });
};

const RoleSalaryGradeMapping = mongoose.model(
  "RoleSalaryGradeMapping",
  roleSalaryGradeMappingSchema
);

export default RoleSalaryGradeMapping;

