import React from "react";
import { HiOutlineDocumentText } from "react-icons/hi";

/**
 * EDMSLogo - A modern, text-based logo for the app with document icon.
 * @param {"light"|"dark"} variant - 'light' for dark backgrounds, 'dark' for light backgrounds
 */
const EDMSLogo = ({ variant = "light", className = "" }) => {
  const accent = variant === "light" ? "text-cyan-400" : "text-blue-600";
  const base = variant === "light" ? "text-white" : "text-blue-900";
  const shadow = variant === "light" ? "drop-shadow-lg" : "drop-shadow-sm";

  return (
    <div
      className={`flex items-center justify-center select-none ${className}`}
      style={{ letterSpacing: "0.05em" }}
    >
      <span
        className={`font-extrabold text-2xl md:text-3xl tracking-wide ${base} ${shadow}`}
        style={{
          fontFamily:
            "'Poppins', ui-sans-serif, system-ui, sans-serif !important",
          fontWeight: 800,
          letterSpacing: "0.05em",
          WebkitFontSmoothing: "antialiased",
          MozOsxFontSmoothing: "grayscale",
          fontStyle: "normal",
        }}
      >
        E
        <span
          className={`${accent} inline-block align-middle`}
          style={{ verticalAlign: "middle" }}
        >
          <HiOutlineDocumentText
            className="inline-block"
            style={{
              fontSize: "1.25em",
              verticalAlign: "middle",
              margin: "0 0.05em",
            }}
            aria-label="Document D"
          />
        </span>
        MS
      </span>
    </div>
  );
};

export default EDMSLogo;
