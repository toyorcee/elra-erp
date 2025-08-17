import React from "react";
import { motion } from "framer-motion";
import { HiShieldCheck, HiHandRaised } from "react-icons/hi2";

const DeductionTypeSelector = ({ onSelectType, onClose }) => {
  const handleTypeSelect = (type) => {
    onSelectType(type);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="bg-white rounded-3xl shadow-2xl p-8 max-w-2xl w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Choose Deduction Type
          </h2>
          <p className="text-gray-600">
            Select the type of deduction you want to create
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Statutory Deduction Card */}
          <motion.div
            whileHover={{ scale: 1.02, y: -5 }}
            whileTap={{ scale: 0.98 }}
            className="group cursor-pointer"
            onClick={() => handleTypeSelect("statutory")}
          >
            <div className="bg-gradient-to-br from-[var(--elra-primary)] to-[var(--elra-primary-dark)] text-white p-8 rounded-2xl shadow-lg border-2 border-transparent group-hover:border-white/20 transition-all duration-300">
              <div className="flex items-center justify-center mb-6">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                  <HiShieldCheck className="w-8 h-8 text-white" />
                </div>
              </div>
              <h3 className="text-2xl font-bold mb-3 text-center">
                Statutory Deduction
              </h3>
              <p className="text-white/90 text-center mb-4">
                Government-mandated deductions like PAYE, Pension, and NHIS
              </p>
              <div className="space-y-2 text-sm text-white/80">
                <div className="flex items-center justify-center">
                  <span className="w-2 h-2 bg-white/60 rounded-full mr-2"></span>
                  Automatically approved
                </div>
                <div className="flex items-center justify-center">
                  <span className="w-2 h-2 bg-white/60 rounded-full mr-2"></span>
                  Required by law
                </div>
                <div className="flex items-center justify-center">
                  <span className="w-2 h-2 bg-white/60 rounded-full mr-2"></span>
                  Company-wide application
                </div>
              </div>
            </div>
          </motion.div>

          {/* Voluntary Deduction Card */}
          <motion.div
            whileHover={{ scale: 1.02, y: -5 }}
            whileTap={{ scale: 0.98 }}
            className="group cursor-pointer"
            onClick={() => handleTypeSelect("voluntary")}
          >
            <div className="bg-gradient-to-br from-[var(--elra-primary)] to-[var(--elra-primary-dark)] text-white p-8 rounded-2xl shadow-lg border-2 border-transparent group-hover:border-white/20 transition-all duration-300">
              <div className="flex items-center justify-center mb-6">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                  <HiHandRaised className="w-8 h-8 text-white" />
                </div>
              </div>
              <h3 className="text-2xl font-bold mb-3 text-center">
                Voluntary Deduction
              </h3>
              <p className="text-white/90 text-center mb-4">
                Optional deductions like insurance, loans, or special arrangements
              </p>
              <div className="space-y-2 text-sm text-white/80">
                <div className="flex items-center justify-center">
                  <span className="w-2 h-2 bg-white/60 rounded-full mr-2"></span>
                  Requires approval
                </div>
                <div className="flex items-center justify-center">
                  <span className="w-2 h-2 bg-white/60 rounded-full mr-2"></span>
                  Flexible scope options
                </div>
                <div className="flex items-center justify-center">
                  <span className="w-2 h-2 bg-white/60 rounded-full mr-2"></span>
                  Employee or department specific
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        <div className="text-center mt-8">
          <button
            onClick={onClose}
            className="px-6 py-3 text-gray-600 hover:text-gray-800 font-medium transition-colors"
          >
            Cancel
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default DeductionTypeSelector;
