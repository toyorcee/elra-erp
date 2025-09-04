export const formatCurrency = (amount) => {
  if (amount === undefined || amount === null || isNaN(amount)) {
    return "₦0";
  }

  const numericAmount =
    typeof amount === "string" ? parseFloat(amount) : amount;

  if (isNaN(numericAmount)) {
    return "₦0";
  }

  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
    useGrouping: true,
  }).format(numericAmount);
};

export const formatNumber = (number) => {
  // Handle undefined, null, or NaN values
  if (number === undefined || number === null || isNaN(number)) {
    return "0";
  }

  // Ensure number is a number
  const numericValue = typeof number === "string" ? parseFloat(number) : number;

  // Double-check for NaN after conversion
  if (isNaN(numericValue)) {
    return "0";
  }

  return new Intl.NumberFormat("en-NG", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
    useGrouping: true,
  }).format(numericValue);
};

export const formatQuantity = (quantity, unit) => {
  // Handle undefined, null, or NaN values
  if (quantity === undefined || quantity === null || isNaN(quantity)) {
    return `0 ${unit || "units"}`;
  }

  // Ensure quantity is a number
  const numericQuantity =
    typeof quantity === "string" ? parseFloat(quantity) : quantity;

  // Double-check for NaN after conversion
  if (isNaN(numericQuantity)) {
    return `0 ${unit || "units"}`;
  }

  const maxFractionDigits = unit === "tonnes" ? 2 : 0;

  const formattedQuantity = new Intl.NumberFormat("en-NG", {
    minimumFractionDigits: 0,
    maximumFractionDigits: maxFractionDigits,
    useGrouping: true,
  }).format(numericQuantity);

  return `${formattedQuantity} ${unit || "units"}`;
};

export const formatDate = (date) => {
  if (!date) return "N/A";

  const dateObj = new Date(date);

  // Check if date is valid
  if (isNaN(dateObj.getTime())) {
    return "Invalid Date";
  }

  return new Intl.DateTimeFormat("en-NG", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(dateObj);
};

// Helper function to get profile picture URL with cache busting
export const getProfilePictureUrl = (profilePicture, backendUrl) => {
  if (!profilePicture?.url) return null;

  const cacheBuster =
    profilePicture.url.split("/").pop().split(".")[0] || Date.now();
  return `${backendUrl}${profilePicture.url}?v=${cacheBuster}`;
};

export const getImageUrl = (img, backendUrl) => {
  if (!img) return null;
  if (
    typeof img === "string" &&
    (img.startsWith("http://") || img.startsWith("https://"))
  ) {
    return img;
  }
  // If object with .url
  const url = typeof img === "string" ? img : img.url;
  if (!url) return null;
  const cacheBuster = url.split("/").pop().split(".")[0] || Date.now();
  return `${backendUrl}${url}?v=${cacheBuster}`;
};

/**
 * Format a number with commas for input fields (no symbol)
 * @param {string} value - The input value to format
 * @returns {string} - Formatted string with commas
 */
export const formatNumberWithCommas = (value) => {
  if (!value) return "";

  const stringValue = typeof value === "number" ? value.toString() : value;

  const cleanValue = stringValue.replace(/[^\d.]/g, "");

  if (cleanValue && !isNaN(cleanValue)) {
    const parts = cleanValue.split(".");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return parts.join(".");
  }

  return cleanValue;
};

/**
 * Check if a field name is a number field that should be formatted
 * @param {string} fieldName - The field name to check
 * @returns {boolean} - True if it's a number field
 */
export const isNumberField = (fieldName) => {
  const numberFields = [
    "minGrossSalary",
    "maxGrossSalary",
    "housing",
    "transport",
    "meal",
    "other",
    "increment",
    "yearsOfService",
    "amount",
  ];

  // Check if the field name contains any of the number field patterns
  return numberFields.some((field) => fieldName.includes(field));
};

/**
 * Parse a formatted number string back to a number
 * @param {string} formattedValue -
 * @returns {number} - The parsed number
 */
export const parseFormattedNumber = (formattedValue) => {
  if (!formattedValue) return 0;

  // Convert to string if it's a number
  const stringValue =
    typeof formattedValue === "number"
      ? formattedValue.toString()
      : formattedValue;

  // Remove commas and convert to number
  const cleanValue = stringValue.replace(/,/g, "");
  const num = parseFloat(cleanValue);

  return isNaN(num) ? 0 : num;
};
