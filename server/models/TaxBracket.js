import mongoose from "mongoose";

const taxBracketSchema = new mongoose.Schema(
  {
    // Bracket name/description
    name: {
      type: String,
      required: true,
      trim: true,
    },

    // Annual income range
    minAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    maxAmount: {
      type: Number,
      // null means unlimited
    },

    // Tax rate for this bracket
    taxRate: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },

    // Additional tax amount (for progressive tax)
    additionalTax: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Order of brackets (for sorting)
    order: {
      type: Number,
      required: true,
      min: 1,
    },

    // Status
    isActive: {
      type: Boolean,
      default: true,
    },

    // Audit fields
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

// Indexes
taxBracketSchema.index({ order: 1, isActive: 1 });
taxBracketSchema.index({ minAmount: 1, maxAmount: 1 });

// Static method to get all active brackets ordered
taxBracketSchema.statics.getActiveBrackets = function () {
  return this.find({ isActive: true }).sort({ order: 1 });
};

// Static method to calculate PAYE for annual income
taxBracketSchema.statics.calculatePAYE = function (annualIncome) {
  return this.getActiveBrackets().then((brackets) => {
    let totalTax = 0;
    let remainingIncome = annualIncome;

    for (const bracket of brackets) {
      if (remainingIncome <= 0) break;

      const bracketMin = bracket.minAmount;
      const bracketMax = bracket.maxAmount || Infinity;

      // Calculate taxable amount in this bracket
      const taxableInBracket = Math.min(
        remainingIncome,
        bracketMax - bracketMin
      );

      if (taxableInBracket > 0) {
        // Calculate tax for this bracket
        const bracketTax = (taxableInBracket * bracket.taxRate) / 100;
        totalTax += bracketTax + bracket.additionalTax;

        remainingIncome -= taxableInBracket;
      }
    }

    return totalTax;
  });
};

// Static method to calculate monthly PAYE
taxBracketSchema.statics.calculateMonthlyPAYE = function (monthlyIncome) {
  const annualIncome = monthlyIncome * 12;
  return this.calculatePAYE(annualIncome).then((annualTax) => {
    return annualTax / 12;
  });
};

const TaxBracket = mongoose.model("TaxBracket", taxBracketSchema);

export default TaxBracket;
