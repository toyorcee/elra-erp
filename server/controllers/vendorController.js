import mongoose from "mongoose";
import Vendor from "../models/Vendor.js";

// @desc    Get all approved vendors
// @route   GET /api/vendors/approved
// @access  Private
export const getApprovedVendors = async (req, res) => {
  try {
    const vendors = await Vendor.find({ status: "approved" })
      .select("name contactPerson servicesOffered status")
      .sort({ name: 1 });

    res.status(200).json({
      success: true,
      data: vendors,
    });
  } catch (error) {
    console.error("Error fetching approved vendors:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching approved vendors",
      error: error.message,
    });
  }
};

// @desc    Get vendors by service category
// @route   GET /api/vendors/category/:category
// @access  Private
export const getVendorsByCategory = async (req, res) => {
  try {
    const { category } = req.params;

    const vendors = await Vendor.find({
      servicesOffered: category,
      status: "approved",
    })
      .select("name contactPerson servicesOffered status")
      .sort({ name: 1 });

    res.status(200).json({
      success: true,
      data: vendors,
    });
  } catch (error) {
    console.error("Error fetching vendors by category:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching vendors by category",
      error: error.message,
    });
  }
};

// @desc    Get vendor by ID
// @route   GET /api/vendors/:id
// @access  Private
export const getVendorById = async (req, res) => {
  try {
    const { id } = req.params;

    const vendor = await Vendor.findById(id);
    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: "Vendor not found",
      });
    }

    res.status(200).json({
      success: true,
      data: vendor,
    });
  } catch (error) {
    console.error("Error fetching vendor:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching vendor",
      error: error.message,
    });
  }
};

// @desc    Get vendor categories
// @route   GET /api/vendors/categories
// @access  Private
export const getVendorCategories = async (req, res) => {
  try {
    // Get categories from Vendor schema
    const categories = [
      { value: "software_development", label: "Software Development" },
      { value: "training", label: "Training" },
      { value: "supply", label: "Supply" },
      { value: "consulting", label: "Consulting" },
      { value: "maintenance", label: "Maintenance" },
      { value: "installation", label: "Installation" },
      { value: "transportation", label: "Transportation" },
      { value: "construction", label: "Construction" },
      { value: "equipment_rental", label: "Equipment Rental" },
      { value: "other", label: "Other" },
    ];

    res.status(200).json({
      success: true,
      data: categories,
    });
  } catch (error) {
    console.error("Error fetching vendor categories:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching vendor categories",
      error: error.message,
    });
  }
};
