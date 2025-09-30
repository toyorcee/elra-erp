/**
 * UNIFIED CATEGORY SYSTEM FOR ELRA ERP
 *
 * This file defines a comprehensive category system that works across
 * all models: Project, Procurement, and Inventory.
 *
 * The system is designed to be:
 * 1. Comprehensive - covers all business needs
 * 2. Consistent - same categories across all models
 * 3. Extensible - easy to add new categories
 * 4. Mappable - clear relationships between categories
 */

// ============================================================================
// UNIFIED CATEGORY ENUM - Use this across ALL models
// ============================================================================
export const UNIFIED_CATEGORIES = [
  // ============================================================================
  // EQUIPMENT & MACHINERY
  // ============================================================================
  "construction_equipment", // Heavy machinery, excavators, bulldozers
  "office_equipment", // Computers, printers, office machines
  "medical_equipment", // Hospital equipment, medical devices
  "agricultural_equipment", // Farming equipment, tractors
  "industrial_equipment", // Manufacturing equipment, production lines
  "kitchen_equipment", // Restaurant equipment, cooking appliances
  "cleaning_equipment", // Cleaning machines, vacuum cleaners
  "security_equipment", // Cameras, alarms, access control systems
  "telecommunications_equipment", // Phones, routers, communication devices

  // ============================================================================
  // VEHICLES & TRANSPORTATION
  // ============================================================================
  "passenger_vehicle", // Cars, SUVs, personal vehicles
  "commercial_vehicle", // Trucks, delivery vehicles
  "construction_vehicle", // Heavy construction vehicles
  "agricultural_vehicle", // Farm vehicles, tractors
  "emergency_vehicle", // Ambulances, fire trucks
  "specialized_vehicle", // Custom vehicles for specific purposes

  // ============================================================================
  // PROPERTY & REAL ESTATE
  // ============================================================================
  "office_space", // Office buildings, workspaces
  "warehouse", // Storage facilities, distribution centers
  "residential", // Housing, apartments, homes
  "commercial_space", // Retail spaces, shopping centers
  "industrial_space", // Manufacturing facilities, plants
  "land", // Raw land, plots, development sites

  // ============================================================================
  // SOFTWARE & TECHNOLOGY
  // ============================================================================
  "software_development", // Custom software, applications
  "software_licenses", // Software licenses, subscriptions
  "it_equipment", // Servers, networking equipment
  "cloud_services", // Cloud computing, SaaS services
  "cybersecurity", // Security software, firewalls
  "data_management", // Database systems, data analytics
  "mobile_applications", // Mobile apps, mobile development

  // ============================================================================
  // FURNITURE & FIXTURES
  // ============================================================================
  "office_furniture", // Desks, chairs, office furniture
  "hospitality_furniture", // Hotel, restaurant furniture
  "residential_furniture", // Home furniture, household items
  "outdoor_furniture", // Garden furniture, outdoor seating
  "specialized_furniture", // Medical, laboratory furniture

  // ============================================================================
  // ELECTRONICS & APPLIANCES
  // ============================================================================
  "consumer_electronics", // TVs, audio equipment, gadgets
  "home_appliances", // Refrigerators, washing machines
  "office_electronics", // Printers, scanners, office electronics
  "industrial_electronics", // Control systems, automation equipment
  "entertainment_electronics", // Gaming, entertainment systems

  // ============================================================================
  // TOOLS & INSTRUMENTS
  // ============================================================================
  "hand_tools", // Manual tools, wrenches, screwdrivers
  "power_tools", // Electric tools, drills, saws
  "measuring_instruments", // Calipers, meters, measuring devices
  "safety_equipment", // Helmets, safety gear, protective equipment
  "laboratory_equipment", // Scientific instruments, lab tools

  // ============================================================================
  // SUPPLIES & CONSUMABLES
  // ============================================================================
  "office_supplies", // Paper, pens, office consumables
  "maintenance_parts", // Spare parts, replacement components
  "cleaning_supplies", // Cleaning products, detergents
  "medical_supplies", // Medical consumables, bandages
  "food_beverages", // Food items, beverages, catering

  // ============================================================================
  // SERVICES & CONSULTING
  // ============================================================================
  "consulting_services", // Business consulting, advisory services
  "training_services", // Training programs, workshops
  "maintenance_services", // Equipment maintenance, repair services
  "cleaning_services", // Janitorial, cleaning services
  "security_services", // Security guards, monitoring services
  "it_services", // IT support, technical services

  // ============================================================================
  // UTILITIES & INFRASTRUCTURE
  // ============================================================================
  "electrical_systems", // Electrical installations, power systems
  "plumbing_systems", // Water systems, plumbing fixtures
  "hvac_systems", // Heating, ventilation, air conditioning
  "telecommunications", // Phone systems, internet infrastructure
  "waste_management", // Waste disposal, recycling systems

  // ============================================================================
  // DEPARTMENTAL PROJECT CATEGORIES
  // ============================================================================
  "internal_training", // Internal staff training programs
  "department_development", // Department-specific development initiatives
  "process_improvement", // Internal process optimization
  "team_building", // Team building activities and events
  "skill_development", // Professional skill development programs
  "research_development", // Internal research and development
  "system_upgrade", // Internal system upgrades and maintenance
  "compliance_training", // Regulatory compliance training
  "leadership_development", // Leadership and management development
  "innovation_projects", // Innovation and experimentation projects
  "department_equipment", // Department-specific equipment purchases
  "workspace_improvement", // Office space and workspace improvements
  "technology_adoption", // New technology adoption and implementation
  "quality_improvement", // Quality management and improvement initiatives
  "sustainability_projects", // Environmental and sustainability projects

  // ============================================================================
  // OTHER & MISCELLANEOUS
  // ============================================================================
  "other", // Catch-all for uncategorized items
];

// ============================================================================
// CATEGORY MAPPING FUNCTIONS
// ============================================================================

/**
 * Maps any category to a valid unified category
 * This ensures backward compatibility and handles legacy categories
 */
export const mapToUnifiedCategory = (category) => {
  const categoryMap = {
    // Legacy Project categories
    software_development: "software_development",
    system_maintenance: "it_services",
    infrastructure_upgrade: "it_equipment",
    digital_transformation: "software_development",
    data_management: "data_management",
    security_enhancement: "cybersecurity",
    process_automation: "software_development",
    integration_project: "software_development",

    equipment_purchase: "industrial_equipment",
    equipment_lease: "industrial_equipment",
    facility_improvement: "office_space",
    infrastructure_development: "industrial_space",
    equipment_maintenance: "maintenance_services",

    training_program: "training_services",
    capacity_building: "training_services",
    skill_development: "skill_development",
    professional_development: "skill_development",

    consulting: "consulting_services",
    training: "training_services",

    // Departmental project categories
    internal: "internal_training",
    internal_training: "internal_training",
    department_development: "department_development",
    process_improvement: "process_improvement",
    team_building: "team_building",
    research: "research_development",
    development: "department_development",
    maintenance: "system_upgrade",

    // Legacy Procurement categories
    equipment: "industrial_equipment",
    vehicle: "passenger_vehicle",
    property: "office_space",
    furniture: "office_furniture",
    electronics: "consumer_electronics",
    office_supplies: "office_supplies",
    maintenance_parts: "maintenance_parts",

    // Legacy Inventory categories (already match)
    construction_equipment: "construction_equipment",
    office_equipment: "office_equipment",
    medical_equipment: "medical_equipment",
    agricultural_equipment: "agricultural_equipment",
    industrial_equipment: "industrial_equipment",
    passenger_vehicle: "passenger_vehicle",
    commercial_vehicle: "commercial_vehicle",
    construction_vehicle: "construction_vehicle",
    agricultural_vehicle: "agricultural_vehicle",
    office_space: "office_space",
    warehouse: "warehouse",
    residential: "residential",
    commercial_space: "commercial_space",
    software_development: "software_development",
    software_licenses: "software_licenses",
    it_equipment: "it_equipment",
    cloud_services: "cloud_services",
    furniture: "office_furniture",
    electronics: "consumer_electronics",
    tools: "hand_tools",
  };

  return categoryMap[category] || "other";
};

/**
 * Gets the category type (equipment, vehicle, property, etc.)
 * This helps with inventory management and reporting
 */
export const getCategoryType = (category) => {
  const typeMap = {
    // Equipment & Machinery
    construction_equipment: "equipment",
    office_equipment: "equipment",
    medical_equipment: "equipment",
    agricultural_equipment: "equipment",
    industrial_equipment: "equipment",
    kitchen_equipment: "equipment",
    cleaning_equipment: "equipment",
    security_equipment: "equipment",
    telecommunications_equipment: "equipment",

    // Vehicles
    passenger_vehicle: "vehicle",
    commercial_vehicle: "vehicle",
    construction_vehicle: "vehicle",
    agricultural_vehicle: "vehicle",
    emergency_vehicle: "vehicle",
    specialized_vehicle: "vehicle",

    // Property
    office_space: "property",
    warehouse: "property",
    residential: "property",
    commercial_space: "property",
    industrial_space: "property",
    land: "property",

    // Software & Technology
    software_development: "software",
    software_licenses: "software",
    it_equipment: "equipment",
    cloud_services: "software",
    cybersecurity: "software",
    data_management: "software",
    mobile_applications: "software",

    // Furniture
    office_furniture: "furniture",
    hospitality_furniture: "furniture",
    residential_furniture: "furniture",
    outdoor_furniture: "furniture",
    specialized_furniture: "furniture",

    // Electronics
    consumer_electronics: "electronics",
    home_appliances: "electronics",
    office_electronics: "electronics",
    industrial_electronics: "electronics",
    entertainment_electronics: "electronics",

    // Tools
    hand_tools: "tools",
    power_tools: "tools",
    measuring_instruments: "tools",
    safety_equipment: "tools",
    laboratory_equipment: "tools",

    // Supplies
    office_supplies: "supplies",
    maintenance_parts: "supplies",
    cleaning_supplies: "supplies",
    medical_supplies: "supplies",
    food_beverages: "supplies",

    // Services
    consulting_services: "services",
    training_services: "services",
    maintenance_services: "services",
    cleaning_services: "services",
    security_services: "services",
    it_services: "services",

    // Utilities
    electrical_systems: "utilities",
    plumbing_systems: "utilities",
    hvac_systems: "utilities",
    telecommunications: "utilities",
    waste_management: "utilities",

    // Other
    other: "other",
  };

  return typeMap[category] || "other";
};

/**
 * Gets category display name for UI
 */
export const getCategoryDisplayName = (category) => {
  const displayNames = {
    construction_equipment: "Construction Equipment",
    office_equipment: "Office Equipment",
    medical_equipment: "Medical Equipment",
    agricultural_equipment: "Agricultural Equipment",
    industrial_equipment: "Industrial Equipment",
    kitchen_equipment: "Kitchen Equipment",
    cleaning_equipment: "Cleaning Equipment",
    security_equipment: "Security Equipment",
    telecommunications_equipment: "Telecommunications Equipment",

    passenger_vehicle: "Passenger Vehicle",
    commercial_vehicle: "Commercial Vehicle",
    construction_vehicle: "Construction Vehicle",
    agricultural_vehicle: "Agricultural Vehicle",
    emergency_vehicle: "Emergency Vehicle",
    specialized_vehicle: "Specialized Vehicle",

    office_space: "Office Space",
    warehouse: "Warehouse",
    residential: "Residential",
    commercial_space: "Commercial Space",
    industrial_space: "Industrial Space",
    land: "Land",

    software_development: "Software Development",
    software_licenses: "Software Licenses",
    it_equipment: "IT Equipment",
    cloud_services: "Cloud Services",
    cybersecurity: "Cybersecurity",
    data_management: "Data Management",
    mobile_applications: "Mobile Applications",

    office_furniture: "Office Furniture",
    hospitality_furniture: "Hospitality Furniture",
    residential_furniture: "Residential Furniture",
    outdoor_furniture: "Outdoor Furniture",
    specialized_furniture: "Specialized Furniture",

    consumer_electronics: "Consumer Electronics",
    home_appliances: "Home Appliances",
    office_electronics: "Office Electronics",
    industrial_electronics: "Industrial Electronics",
    entertainment_electronics: "Entertainment Electronics",

    hand_tools: "Hand Tools",
    power_tools: "Power Tools",
    measuring_instruments: "Measuring Instruments",
    safety_equipment: "Safety Equipment",
    laboratory_equipment: "Laboratory Equipment",

    office_supplies: "Office Supplies",
    maintenance_parts: "Maintenance Parts",
    cleaning_supplies: "Cleaning Supplies",
    medical_supplies: "Medical Supplies",
    food_beverages: "Food & Beverages",

    consulting_services: "Consulting Services",
    training_services: "Training Services",
    maintenance_services: "Maintenance Services",
    cleaning_services: "Cleaning Services",
    security_services: "Security Services",
    it_services: "IT Services",

    electrical_systems: "Electrical Systems",
    plumbing_systems: "Plumbing Systems",
    hvac_systems: "HVAC Systems",
    telecommunications: "Telecommunications",
    waste_management: "Waste Management",

    // Departmental project categories
    internal_training: "Internal Training",
    department_development: "Department Development",
    process_improvement: "Process Improvement",
    team_building: "Team Building",
    skill_development: "Skill Development",
    research_development: "Research & Development",
    system_upgrade: "System Upgrade",
    compliance_training: "Compliance Training",
    leadership_development: "Leadership Development",
    innovation_projects: "Innovation Projects",
    department_equipment: "Department Equipment",
    workspace_improvement: "Workspace Improvement",
    technology_adoption: "Technology Adoption",
    quality_improvement: "Quality Improvement",
    sustainability_projects: "Sustainability Projects",

    other: "Other",
  };

  return displayNames[category] || category;
};

/**
 * Gets categories grouped by type for UI dropdowns
 */
export const getCategoriesByType = () => {
  return {
    "Equipment & Machinery": [
      "construction_equipment",
      "office_equipment",
      "medical_equipment",
      "agricultural_equipment",
      "industrial_equipment",
      "kitchen_equipment",
      "cleaning_equipment",
      "security_equipment",
      "telecommunications_equipment",
    ],
    "Vehicles & Transportation": [
      "passenger_vehicle",
      "commercial_vehicle",
      "construction_vehicle",
      "agricultural_vehicle",
      "emergency_vehicle",
      "specialized_vehicle",
    ],
    "Property & Real Estate": [
      "office_space",
      "warehouse",
      "residential",
      "commercial_space",
      "industrial_space",
      "land",
    ],
    "Software & Technology": [
      "software_development",
      "software_licenses",
      "it_equipment",
      "cloud_services",
      "cybersecurity",
      "data_management",
      "mobile_applications",
    ],
    "Furniture & Fixtures": [
      "office_furniture",
      "hospitality_furniture",
      "residential_furniture",
      "outdoor_furniture",
      "specialized_furniture",
    ],
    "Electronics & Appliances": [
      "consumer_electronics",
      "home_appliances",
      "office_electronics",
      "industrial_electronics",
      "entertainment_electronics",
    ],
    "Tools & Instruments": [
      "hand_tools",
      "power_tools",
      "measuring_instruments",
      "safety_equipment",
      "laboratory_equipment",
    ],
    "Supplies & Consumables": [
      "office_supplies",
      "maintenance_parts",
      "cleaning_supplies",
      "medical_supplies",
      "food_beverages",
    ],
    "Services & Consulting": [
      "consulting_services",
      "training_services",
      "maintenance_services",
      "cleaning_services",
      "security_services",
      "it_services",
    ],
    "Utilities & Infrastructure": [
      "electrical_systems",
      "plumbing_systems",
      "hvac_systems",
      "telecommunications",
      "waste_management",
    ],
    "Departmental Projects": [
      "internal_training",
      "department_development",
      "process_improvement",
      "team_building",
      "skill_development",
      "research_development",
      "system_upgrade",
      "compliance_training",
      "leadership_development",
      "innovation_projects",
      "department_equipment",
      "workspace_improvement",
      "technology_adoption",
      "quality_improvement",
      "sustainability_projects",
    ],
    Other: ["other"],
  };
};

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

/**
 * Validates if a category is valid
 */
export const isValidCategory = (category) => {
  return UNIFIED_CATEGORIES.includes(category);
};

/**
 * Validates and normalizes a category
 */
export const validateAndNormalizeCategory = (category) => {
  if (!category) return "other";

  const normalized = mapToUnifiedCategory(category);

  if (!isValidCategory(normalized)) {
    console.warn(`Invalid category: ${category}, using "other"`);
    return "other";
  }

  return normalized;
};

export default {
  UNIFIED_CATEGORIES,
  mapToUnifiedCategory,
  getCategoryType,
  getCategoryDisplayName,
  getCategoriesByType,
  isValidCategory,
  validateAndNormalizeCategory,
};
