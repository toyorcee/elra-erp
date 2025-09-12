// Unified Categories - matches server/constants/unifiedCategories.js
export const UNIFIED_CATEGORIES = [
  // Equipment & Machinery
  "construction_equipment",
  "office_equipment", 
  "medical_equipment",
  "industrial_equipment",
  "security_equipment",
  
  // Vehicles & Transportation
  "passenger_vehicle",
  "commercial_vehicle",
  "construction_vehicle",
  "emergency_vehicle",
  
  // Software & Technology
  "software_development",
  "software_licenses",
  "it_equipment",
  "cloud_services",
  
  // Furniture & Fixtures
  "office_furniture",
  "hospitality_furniture",
  "residential_furniture",
  
  // Electronics & Appliances
  "consumer_electronics",
  "office_electronics",
  "home_appliances",
  
  // Other
  "other"
];

// Category display names for UI
export const CATEGORY_DISPLAY_NAMES = {
  // Equipment & Machinery
  construction_equipment: "Construction Equipment",
  office_equipment: "Office Equipment",
  medical_equipment: "Medical Equipment",
  industrial_equipment: "Industrial Equipment",
  security_equipment: "Security Equipment",
  
  // Vehicles & Transportation
  passenger_vehicle: "Passenger Vehicle",
  commercial_vehicle: "Commercial Vehicle",
  construction_vehicle: "Construction Vehicle",
  emergency_vehicle: "Emergency Vehicle",
  
  // Software & Technology
  software_development: "Software Development",
  software_licenses: "Software Licenses",
  it_equipment: "IT Equipment",
  cloud_services: "Cloud Services",
  
  // Furniture & Fixtures
  office_furniture: "Office Furniture",
  hospitality_furniture: "Hospitality Furniture",
  residential_furniture: "Residential Furniture",
  
  // Electronics & Appliances
  consumer_electronics: "Consumer Electronics",
  office_electronics: "Office Electronics",
  home_appliances: "Home Appliances",
  
  // Other
  other: "Other"
};

// Category groups for organized display
export const CATEGORY_GROUPS = [
  {
    label: "Equipment & Machinery",
    categories: [
      "construction_equipment",
      "office_equipment",
      "medical_equipment", 
      "industrial_equipment",
      "security_equipment"
    ]
  },
  {
    label: "Vehicles & Transportation",
    categories: [
      "passenger_vehicle",
      "commercial_vehicle",
      "construction_vehicle",
      "emergency_vehicle"
    ]
  },
  {
    label: "Software & Technology",
    categories: [
      "software_development",
      "software_licenses",
      "it_equipment",
      "cloud_services"
    ]
  },
  {
    label: "Furniture & Fixtures",
    categories: [
      "office_furniture",
      "hospitality_furniture",
      "residential_furniture"
    ]
  },
  {
    label: "Electronics & Appliances",
    categories: [
      "consumer_electronics",
      "office_electronics",
      "home_appliances"
    ]
  },
  {
    label: "Other",
    categories: ["other"]
  }
];
