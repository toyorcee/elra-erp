import Papa from "papaparse";

/**
 * Parse CSV file content and extract employee data
 * @param {string} csvContent - Raw CSV content
 * @returns {Object} Parsed data with validation results
 */
export const parseEmployeeCSV = (csvContent) => {
  try {
    console.log("📊 [CSV_UTILS] Starting CSV parsing...");

    const result = Papa.parse(csvContent, {
      header: true,
      skipEmptyLines: true,
      trimHeaders: true,
      trimValues: true,
    });

    if (result.errors && result.errors.length > 0) {
      console.log("❌ [CSV_UTILS] CSV parsing errors:", result.errors);
      return {
        success: false,
        errors: result.errors.map(
          (error) => `Row ${error.row + 1}: ${error.message}`
        ),
        data: null,
      };
    }

    if (!result.data || result.data.length === 0) {
      console.log("❌ [CSV_UTILS] No data found in CSV");
      return {
        success: false,
        errors: ["No data found in CSV file"],
        data: null,
      };
    }

    console.log(
      `✅ [CSV_UTILS] Successfully parsed ${result.data.length} rows`
    );

    // Validate required fields
    const requiredFields = [
      "email",
      "firstName",
      "lastName",
      "department",
      "role",
      "salaryGrade",
    ];
    const validationErrors = [];
    const validatedData = [];

    result.data.forEach((row, index) => {
      const rowNumber = index + 1;
      const rowErrors = [];

      // Check required fields
      requiredFields.forEach((field) => {
        if (!row[field] || row[field].trim() === "") {
          rowErrors.push(`Missing required field: ${field}`);
        }
      });

      // Validate email format
      if (row.email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(row.email.trim())) {
          rowErrors.push(`Invalid email format: ${row.email}`);
        }
      }

      // Validate salary grade format
      if (row.salaryGrade) {
        const salaryGradeRegex = /^Grade\s+\d{1,2}$/i;
        if (!salaryGradeRegex.test(row.salaryGrade.trim())) {
          rowErrors.push(
            `Invalid salary grade format: ${row.salaryGrade} (should be like "Grade 01")`
          );
        }
      }

      if (rowErrors.length > 0) {
        validationErrors.push({
          row: rowNumber,
          email: row.email || "N/A",
          errors: rowErrors,
        });
      } else {
        // Clean and normalize data
        const cleanRow = {
          email: row.email.trim().toLowerCase(),
          firstName: row.firstName.trim(),
          lastName: row.lastName.trim(),
          department: row.department.trim(),
          role: row.role.trim(),
          salaryGrade: row.salaryGrade.trim(),
          jobTitle: row.jobTitle ? row.jobTitle.trim() : "",
          phone: row.phone ? row.phone.trim() : "",
          employeeId: row.employeeId ? row.employeeId.trim() : "",
          position: row.position ? row.position.trim() : "",
        };
        validatedData.push(cleanRow);
      }
    });

    console.log(`📊 [CSV_UTILS] Validation results:`, {
      totalRows: result.data.length,
      validRows: validatedData.length,
      invalidRows: validationErrors.length,
    });

    return {
      success: validationErrors.length === 0,
      data: validatedData,
      errors: validationErrors,
      statistics: {
        totalRows: result.data.length,
        validRows: validatedData.length,
        invalidRows: validationErrors.length,
      },
    };
  } catch (error) {
    console.error("❌ [CSV_UTILS] CSV parsing error:", error);
    return {
      success: false,
      errors: [`CSV parsing error: ${error.message}`],
      data: null,
    };
  }
};

/**
 * Generate CSV template for employee data
 * @returns {string} CSV template content
 */
export const generateEmployeeCSVTemplate = () => {
  const template = [
    {
      email: "john.doe@company.com",
      firstName: "John",
      lastName: "Doe",
      department: "IT Department",
      role: "Software Developer",
      salaryGrade: "Grade 05",
      jobTitle: "Senior Software Developer",
      phone: "+1234567890",
      employeeId: "EMP001",
      position: "Developer",
    },
    {
      email: "jane.smith@company.com",
      firstName: "Jane",
      lastName: "Smith",
      department: "Human Resources",
      role: "HR Manager",
      salaryGrade: "Grade 08",
      jobTitle: "Human Resources Manager",
      phone: "+1234567891",
      employeeId: "EMP002",
      position: "Manager",
    },
  ];

  return Papa.unparse(template);
};

/**
 * Validate CSV headers against expected format
 * @param {Array} headers - CSV headers
 * @returns {Object} Validation result
 */
export const validateCSVHeaders = (headers) => {
  const requiredHeaders = [
    "email",
    "firstName",
    "lastName",
    "department",
    "role",
    "salaryGrade",
  ];
  const optionalHeaders = ["jobTitle", "phone", "employeeId", "position"];
  const allExpectedHeaders = [...requiredHeaders, ...optionalHeaders];

  const missingRequired = requiredHeaders.filter(
    (header) => !headers.includes(header)
  );
  const unexpectedHeaders = headers.filter(
    (header) => !allExpectedHeaders.includes(header)
  );

  return {
    isValid: missingRequired.length === 0,
    missingRequired,
    unexpectedHeaders,
    headers: headers,
  };
};

/**
 * Clean and normalize CSV data
 * @param {Array} data - Raw CSV data
 * @returns {Array} Cleaned data
 */
export const cleanCSVData = (data) => {
  return data.map((row) => {
    const cleaned = {};

    // Clean all string fields
    Object.keys(row).forEach((key) => {
      if (typeof row[key] === "string") {
        cleaned[key] = row[key].trim();
      } else {
        cleaned[key] = row[key];
      }
    });

    // Normalize email
    if (cleaned.email) {
      cleaned.email = cleaned.email.toLowerCase();
    }

    // Normalize salary grade
    if (cleaned.salaryGrade) {
      cleaned.salaryGrade = cleaned.salaryGrade.replace(/\s+/g, " ").trim();
    }

    return cleaned;
  });
};



