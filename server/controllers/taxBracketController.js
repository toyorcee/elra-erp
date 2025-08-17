import TaxBracket from "../models/TaxBracket.js";

// Get all active tax brackets
export const getActiveTaxBrackets = async (req, res) => {
  try {
    const taxBrackets = await TaxBracket.getActiveBrackets();

    // Format the brackets for display
    const formattedBrackets = taxBrackets.map((bracket) => ({
      id: bracket._id,
      name: bracket.name,
      minAmount: bracket.minAmount,
      maxAmount: bracket.maxAmount,
      taxRate: bracket.taxRate,
      additionalTax: bracket.additionalTax,
      order: bracket.order,
      // Format for display
      displayRange: bracket.maxAmount
        ? `₦${bracket.minAmount.toLocaleString()} - ₦${bracket.maxAmount.toLocaleString()}`
        : `₦${bracket.minAmount.toLocaleString()} and above`,
      displayRate: `${bracket.taxRate}%`,
    }));

    res.status(200).json({
      success: true,
      data: {
        brackets: formattedBrackets,
        totalBrackets: formattedBrackets.length,
      },
    });
  } catch (error) {
    console.error("Error fetching tax brackets:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch tax brackets",
      error: error.message,
    });
  }
};

// Get tax brackets for PAYE info (simplified)
export const getPAYEInfo = async (req, res) => {
  try {
    const taxBrackets = await TaxBracket.getActiveBrackets();

    // Format specifically for PAYE info display
    const payeInfo = {
      title: "Nigerian PAYE Tax Brackets (2025)",
      description:
        "Progressive tax rates based on annual income - Official Nigerian Tax System",
      brackets: taxBrackets.map((bracket) => ({
        range: bracket.maxAmount
          ? `₦${bracket.minAmount.toLocaleString()} - ₦${bracket.maxAmount.toLocaleString()}`
          : `₦${bracket.minAmount.toLocaleString()} and above`,
        rate: `${bracket.taxRate}%`,
        additionalTax:
          bracket.additionalTax > 0
            ? `+ ₦${bracket.additionalTax.toLocaleString()}`
            : null,
      })),
      note: "Tax is calculated progressively across all applicable brackets. Each bracket includes the tax from previous brackets.",
    };

    res.status(200).json({
      success: true,
      data: payeInfo,
    });
  } catch (error) {
    console.error("Error fetching PAYE info:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch PAYE information",
      error: error.message,
    });
  }
};
