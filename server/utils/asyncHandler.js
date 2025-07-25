/**
 * Async handler utility for wrapping async route handlers
 * Automatically catches errors and passes them to Express error handling middleware
 */
export const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export default asyncHandler;
