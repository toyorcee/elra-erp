/**
 * Reference Code Generator Utility
 * Generates sequential reference codes for transactions
 */

/**
 * Generate a sequential reference code for any transaction type
 * Format: TYPE-YYYYMMDD-SSSSS
 * Where SSSSS is a sequential number (00001, 00002, etc.)
 *
 * @param {string} type - Transaction type (FUND, PAY, PROJ, TXN, etc.)
 * @param {number} sequenceNumber - Sequential number for the day
 * @returns {string} Generated reference code
 */
export const generateReference = (type, sequenceNumber) => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  // Format sequence number with leading zeros (5 digits)
  const seqNum = String(sequenceNumber).padStart(5, "0");

  return `${type.toUpperCase()}-${year}${month}${day}-${seqNum}`;
};

/**
 * Get the next sequential number for a transaction type for today
 * This should be called from the controller to get the current count
 *
 * @param {string} type - Transaction type
 * @param {number} currentCount - Current count of transactions for this type today
 * @returns {number} Next sequence number
 */
export const getNextSequenceNumber = (type, currentCount) => {
  return currentCount + 1;
};

/**
 * Parse a reference code to extract information
 * Returns an object with parsed components
 */
export const parseReference = (reference) => {
  if (!reference) return null;

  const parts = reference.split("-");
  if (parts.length !== 4) return null;

  const [type, dateStr, timeStr, randomNum] = parts;

  // Parse date (YYYYMMDD)
  const year = dateStr.substring(0, 4);
  const month = dateStr.substring(4, 6);
  const day = dateStr.substring(6, 8);

  // Parse time (HHMMSS)
  const hours = timeStr.substring(0, 2);
  const minutes = timeStr.substring(2, 4);
  const seconds = timeStr.substring(4, 6);

  return {
    type,
    date: `${year}-${month}-${day}`,
    time: `${hours}:${minutes}:${seconds}`,
    timestamp: new Date(
      `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`
    ),
    randomNum,
    fullReference: reference,
  };
};

/**
 * Validate a reference code format
 */
export const validateReference = (reference) => {
  if (!reference) return false;

  const regex = /^(FUND|PAY|PROJ|TXN)-\d{8}-\d{6}-\d{4}$/;
  return regex.test(reference);
};
