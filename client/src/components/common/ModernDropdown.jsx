import React, { Fragment } from "react";
import { Listbox, Transition } from "@headlessui/react";
import { ChevronUpDownIcon, CheckIcon } from "@heroicons/react/20/solid";
import { motion } from "framer-motion";

const ModernDropdown = ({
  options = [],
  value,
  onChange,
  placeholder = "Select an option",
  loading = false,
  disabled = false,
  icon: Icon,
  className = "",
  error = false,
}) => {
  const selectedOption = options.find((option) =>
    typeof option === "object" ? option.value === value : option === value
  );

  const displayValue = selectedOption
    ? typeof selectedOption === "object"
      ? selectedOption.label
      : selectedOption
    : placeholder;

  // Format role names for display (remove underscores, capitalize properly)
  const formatDisplayName = (name) => {
    if (!name) return "";
    return name
      .replace(/_/g, " ")
      .split(" ")
      .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
      .join(" ");
  };

  return (
    <div className={`relative ${className}`}>
      <Listbox value={value} onChange={onChange} disabled={disabled || loading}>
        <div className="relative">
          <Listbox.Button
            className={`
              relative w-full pl-12 pr-10 py-4 text-left bg-white/10 border rounded-xl 
              backdrop-blur-sm transition-all duration-300 cursor-pointer
              focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-400
              ${error ? "border-red-400/50" : "border-white/20"}
              ${
                disabled || loading
                  ? "opacity-50 cursor-not-allowed"
                  : "hover:bg-white/15"
              }
            `}
          >
            {/* Icon */}
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : Icon ? (
                <Icon className="h-5 w-5 text-white/50 group-focus-within:text-purple-400 transition-colors" />
              ) : null}
            </div>

            {/* Selected Value */}
            <span
              className={`block truncate ${
                value ? "text-white" : "text-white/50"
              }`}
            >
              {loading ? "Loading..." : formatDisplayName(displayValue)}
            </span>

            {/* Dropdown Arrow */}
            <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
              <ChevronUpDownIcon
                className="h-5 w-5 text-white/50 transition-transform duration-200"
                aria-hidden="true"
              />
            </div>
          </Listbox.Button>

          <Transition
            as={Fragment}
            leave="transition ease-in duration-100"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <Listbox.Options className="absolute z-50 w-full mt-2 bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl shadow-2xl overflow-hidden max-h-60">
              <div className="max-h-60 overflow-y-auto custom-scrollbar">
                {options.length === 0 ? (
                  <div className="px-4 py-3 text-white/50 text-sm text-center">
                    No options available
                  </div>
                ) : (
                  options.map((option, index) => {
                    const optionValue =
                      typeof option === "object" ? option.value : option;
                    const optionLabel =
                      typeof option === "object" ? option.label : option;

                    return (
                      <motion.div
                        key={optionValue || index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <Listbox.Option
                          className={({ active }) => `
                            relative cursor-pointer select-none px-4 py-3 transition-all duration-200
                            ${
                              active
                                ? "bg-purple-500/20 text-white"
                                : "text-white/90"
                            }
                            hover:bg-purple-500/20
                          `}
                          value={optionValue}
                        >
                          {({ selected, active }) => (
                            <div className="flex items-center justify-between">
                              <div className="flex flex-col flex-1">
                                <span
                                  className={`block font-medium ${
                                    selected ? "text-purple-300" : "text-white"
                                  }`}
                                >
                                  {formatDisplayName(optionLabel)}
                                </span>
                                {typeof option === "object" &&
                                  option.description && (
                                    <span className="text-xs text-white/60 mt-1">
                                      {option.description}
                                    </span>
                                  )}
                              </div>
                              {selected && (
                                <motion.div
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  transition={{ duration: 0.2 }}
                                  className="ml-3"
                                >
                                  <CheckIcon
                                    className="h-5 w-5 text-purple-400"
                                    aria-hidden="true"
                                  />
                                </motion.div>
                              )}
                            </div>
                          )}
                        </Listbox.Option>
                      </motion.div>
                    );
                  })
                )}
              </div>
            </Listbox.Options>
          </Transition>
        </div>
      </Listbox>
    </div>
  );
};

export default ModernDropdown;
