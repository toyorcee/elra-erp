# 🎯 EMPLOYEE METADATA REFACTOR PLAN

## 📋 **CURRENT STATE vs TARGET STATE**

### **Current User Model (Basic):**
```javascript
{
  _id: ObjectId,
  email: String,
  password: String,
  role: String,
  department: String,
  // ... basic fields
}
```

### **Target Employee Model (Comprehensive):**
```javascript
{
  _id: ObjectId,
  // === AUTHENTICATION ===
  email: String,
  password: String,
  role: String,
  isActive: Boolean,
  
  // === PERSONAL INFORMATION ===
  personalInfo: {
    firstName: String,
    lastName: String,
    middleName: String,
    dateOfBirth: Date,
    gender: String,
    nationality: String,
    nationalId: String,
    passportNumber: String,
    taxId: String,
    address: String,
    phone: String,
    emergencyContact: {
      name: String,
      relationship: String,
      phone: String,
      address: String
    }
  },
  
  // === EMPLOYMENT DETAILS ===
  employment: {
    employeeId: String,
    staffNumber: String,
    employmentType: String, // Full-time, Part-time, Contract, Intern
    jobTitle: String,
    department: String,
    reportingTo: ObjectId, // Reference to manager
    hireDate: Date,
    probationEndDate: Date,
    contractEndDate: Date,
    employmentStatus: String, // Active, On Leave, Suspended, Terminated
    workLocation: String,
    workSchedule: String
  },
  
  // === EDUCATION & SKILLS ===
  education: {
    highestQualification: String,
    institution: String,
    graduationYear: Number,
    fieldOfStudy: String,
    technicalSkills: [String],
    languages: [String],
    certifications: [String],
    yearsOfExperience: Number,
    previousEmployer: String
  },
  
  // === COMPENSATION & BENEFITS ===
  compensation: {
    salaryGrade: String,
    salaryStep: String,
    baseSalary: Number,
    housingAllowance: Number,
    transportAllowance: Number,
    mealAllowance: Number,
    bankDetails: {
      bankName: String,
      accountNumber: String,
      accountName: String
    },
    pensionNumber: String,
    healthInsurance: Boolean
  },
  
  // === PERFORMANCE & CAREER ===
  performance: {
    lastReviewDate: Date,
    performanceRating: String,
    nextReviewDate: Date,
    careerGoals: String,
    trainingNeeds: [String],
    promotionEligibility: String,
    directReports: [ObjectId] // Array of employee IDs
  },
  
  // === LEAVE & ATTENDANCE ===
  leave: {
    annualLeaveBalance: Number,
    sickLeaveBalance: Number,
    maternityLeaveBalance: Number,
    paternityLeaveBalance: Number,
    overtimeEligible: Boolean,
    remoteWorkEligible: Boolean,
    workFromHomeDays: Number
  },
  
  // === DOCUMENTS & COMPLIANCE ===
  documents: {
    employmentContract: String, // File path
    idDocument: String,
    educationalCertificate: String,
    professionalLicense: String,
    workPermit: String,
    referenceCheck: String, // Yes, No, Pending
    backgroundCheck: String
  },
  
  // === SECURITY & ACCESS ===
  security: {
    systemAccess: String, // Basic, Standard, Advanced, Admin
    securityClearance: String,
    accessCardNumber: String,
    buildingAccess: String,
    itEquipment: [String]
  },
  
  // === TIMESTAMPS ===
  createdAt: Date,
  updatedAt: Date,
  lastLoginAt: Date
}
```

## 🔄 **REFACTORING STEPS**

### **Phase 1: Database Schema Update**
1. **Create new Employee model** with comprehensive fields
2. **Migrate existing users** to new employee structure
3. **Update all references** from User to Employee
4. **Create indexes** for performance optimization

### **Phase 2: API Endpoints Update**
1. **Update authentication endpoints** to work with new model
2. **Create employee CRUD endpoints** for all metadata
3. **Add validation middleware** for all new fields
4. **Update permission checks** for new data structure

### **Phase 3: Frontend Integration**
1. **Update all forms** to use new metadata structure
2. **Create comprehensive employee profile pages**
3. **Add data validation** on frontend
4. **Update all API calls** to new endpoints

## 📊 **KEY BENEFITS OF THIS STRUCTURE**

### **✅ Professional HR Standards:**
- **Complete employee lifecycle** management
- **Compliance-ready** for government/private sector
- **Scalable** for any organization size
- **Integration-ready** for payroll, attendance, etc.

### **✅ Data Relationships:**
- **Manager-subordinate** relationships
- **Department hierarchies**
- **Performance tracking**
- **Career progression** paths

### **✅ Business Intelligence:**
- **Salary analytics** by grade/department
- **Performance metrics** across organization
- **Leave management** insights
- **Compliance reporting**

## 🎯 **NEXT STEPS**

1. **Review this metadata structure** - any additions/modifications?
2. **Create the backend Employee model** with all these fields
3. **Update the frontend forms** to match the new structure
4. **Test the complete employee lifecycle** from hire to termination

## 💡 **INTEGRATION POINTS**

### **Payroll Module:**
- Uses `compensation` data for salary calculations
- Integrates with `leave` data for deductions
- Tracks `performance` for bonuses

### **Attendance Module:**
- Uses `employment.workSchedule` for attendance rules
- Integrates with `leave` balances
- Tracks `security.accessCardNumber` for physical access

### **Document Management:**
- Stores all `documents` files
- Manages `compliance` requirements
- Tracks document expiration dates

### **Performance Module:**
- Uses `performance` data for reviews
- Tracks `education.certifications` for development
- Manages `performance.careerGoals` for planning

---

**This structure gives us a PROFESSIONAL, ENTERPRISE-GRADE HR system that can handle any organization's needs!** 🚀
