import React from "react";

const ERPFlowchart = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-cyan-800 to-purple-900 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-white text-center mb-8">
          ELRA ERP System Architecture
        </h1>

        {/* Main Business Process Flow */}
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 mb-8">
          <h2 className="text-2xl font-semibold text-white mb-6 flex items-center justify-center">
            <span className="mr-3">🔄</span>
            Main Business Process Flow
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-purple-600/20 border border-purple-400 rounded-lg p-4 text-center">
              <div className="text-2xl mb-2">📝</div>
              <h3 className="text-lg font-semibold text-purple-200 mb-2">
                Data Entry
              </h3>
              <p className="text-purple-100 text-sm">
                Employee, Financial & Operational Data
              </p>
            </div>

            <div className="bg-blue-600/20 border border-blue-400 rounded-lg p-4 text-center">
              <div className="text-2xl mb-2">⚙️</div>
              <h3 className="text-lg font-semibold text-blue-200 mb-2">
                Processing
              </h3>
              <p className="text-blue-100 text-sm">
                Automated Calculations & Workflows
              </p>
            </div>

            <div className="bg-green-600/20 border border-green-400 rounded-lg p-4 text-center">
              <div className="text-2xl mb-2">📊</div>
              <h3 className="text-lg font-semibold text-green-200 mb-2">
                Output
              </h3>
              <p className="text-green-100 text-sm">
                Reports, Payments & Analytics
              </p>
            </div>

            <div className="bg-orange-600/20 border border-orange-400 rounded-lg p-4 text-center">
              <div className="text-2xl mb-2">✅</div>
              <h3 className="text-lg font-semibold text-orange-200 mb-2">
                Approval
              </h3>
              <p className="text-orange-100 text-sm">
                Multi-level Authorization
              </p>
            </div>
          </div>
        </div>

        {/* Module-Specific Process Flows */}
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 mb-8">
          <h2 className="text-2xl font-semibold text-white mb-6">
            Module-Specific Process Flows
          </h2>

          <div className="space-y-8">
            {/* Human Resources Flow */}
            <div className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-purple-400 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-purple-200 mb-4 flex items-center">
                <span className="mr-2">👥</span>
                Human Resources Process Flow
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-purple-500/30 rounded-lg p-3">
                  <h4 className="font-semibold text-purple-200 mb-2">
                    📝 Data Entry
                  </h4>
                  <ul className="text-purple-100 text-sm space-y-1">
                    <li>• Employee profiles</li>
                    <li>• Recruitment applications</li>
                    <li>• Performance reviews</li>
                    <li>• Training records</li>
                  </ul>
                </div>
                <div className="bg-blue-500/30 rounded-lg p-3">
                  <h4 className="font-semibold text-blue-200 mb-2">
                    ⚙️ Processing
                  </h4>
                  <ul className="text-blue-100 text-sm space-y-1">
                    <li>• Candidate screening</li>
                    <li>• Performance calculations</li>
                    <li>• Training scheduling</li>
                    <li>• Workflow automation</li>
                  </ul>
                </div>
                <div className="bg-green-500/30 rounded-lg p-3">
                  <h4 className="font-semibold text-green-200 mb-2">
                    📊 Output
                  </h4>
                  <ul className="text-green-100 text-sm space-y-1">
                    <li>• Employee reports</li>
                    <li>• Performance analytics</li>
                    <li>• Training certificates</li>
                    <li>• HR dashboards</li>
                  </ul>
                </div>
                <div className="bg-orange-500/30 rounded-lg p-3">
                  <h4 className="font-semibold text-orange-200 mb-2">
                    ✅ Approval
                  </h4>
                  <ul className="text-orange-100 text-sm space-y-1">
                    <li>• Hiring decisions</li>
                    <li>• Performance ratings</li>
                    <li>• Training approvals</li>
                    <li>• Policy changes</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Payroll Management Flow */}
            <div className="bg-gradient-to-r from-teal-600/20 to-cyan-600/20 border border-teal-400 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-teal-200 mb-4 flex items-center">
                <span className="mr-2">💰</span>
                Payroll Management Process Flow
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-purple-500/30 rounded-lg p-3">
                  <h4 className="font-semibold text-purple-200 mb-2">
                    📝 Data Entry
                  </h4>
                  <ul className="text-purple-100 text-sm space-y-1">
                    <li>• Time sheets</li>
                    <li>• Salary information</li>
                    <li>• Benefits data</li>
                    <li>• Deduction records</li>
                  </ul>
                </div>
                <div className="bg-blue-500/30 rounded-lg p-3">
                  <h4 className="font-semibold text-blue-200 mb-2">
                    ⚙️ Processing
                  </h4>
                  <ul className="text-blue-100 text-sm space-y-1">
                    <li>• Salary calculations</li>
                    <li>• Tax computations</li>
                    <li>• Benefit deductions</li>
                    <li>• Overtime calculations</li>
                  </ul>
                </div>
                <div className="bg-green-500/30 rounded-lg p-3">
                  <h4 className="font-semibold text-green-200 mb-2">
                    📊 Output
                  </h4>
                  <ul className="text-green-100 text-sm space-y-1">
                    <li>• Payroll reports</li>
                    <li>• Salary payments</li>
                    <li>• Tax filings</li>
                    <li>• Benefit statements</li>
                  </ul>
                </div>
                <div className="bg-orange-500/30 rounded-lg p-3">
                  <h4 className="font-semibold text-orange-200 mb-2">
                    ✅ Approval
                  </h4>
                  <ul className="text-orange-100 text-sm space-y-1">
                    <li>• Payroll approval</li>
                    <li>• Benefit changes</li>
                    <li>• Salary adjustments</li>
                    <li>• Tax submissions</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Procurement Flow */}
            <div className="bg-gradient-to-r from-pink-600/20 to-rose-600/20 border border-pink-400 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-pink-200 mb-4 flex items-center">
                <span className="mr-2">🛒</span>
                Procurement Process Flow
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-purple-500/30 rounded-lg p-3">
                  <h4 className="font-semibold text-purple-200 mb-2">
                    📝 Data Entry
                  </h4>
                  <ul className="text-purple-100 text-sm space-y-1">
                    <li>• Purchase requests</li>
                    <li>• Vendor information</li>
                    <li>• Inventory needs</li>
                    <li>• Contract terms</li>
                  </ul>
                </div>
                <div className="bg-blue-500/30 rounded-lg p-3">
                  <h4 className="font-semibold text-blue-200 mb-2">
                    ⚙️ Processing
                  </h4>
                  <ul className="text-blue-100 text-sm space-y-1">
                    <li>• Vendor evaluation</li>
                    <li>• Price comparisons</li>
                    <li>• Inventory tracking</li>
                    <li>• Order processing</li>
                  </ul>
                </div>
                <div className="bg-green-500/30 rounded-lg p-3">
                  <h4 className="font-semibold text-green-200 mb-2">
                    📊 Output
                  </h4>
                  <ul className="text-green-100 text-sm space-y-1">
                    <li>• Purchase orders</li>
                    <li>• Vendor reports</li>
                    <li>• Inventory reports</li>
                    <li>• Cost analysis</li>
                  </ul>
                </div>
                <div className="bg-orange-500/30 rounded-lg p-3">
                  <h4 className="font-semibold text-orange-200 mb-2">
                    ✅ Approval
                  </h4>
                  <ul className="text-orange-100 text-sm space-y-1">
                    <li>• Purchase approvals</li>
                    <li>• Vendor selection</li>
                    <li>• Contract approvals</li>
                    <li>• Payment authorizations</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Accounting Flow */}
            <div className="bg-gradient-to-r from-blue-600/20 to-indigo-600/20 border border-blue-400 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-blue-200 mb-4 flex items-center">
                <span className="mr-2">📊</span>
                Accounting Process Flow
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-purple-500/30 rounded-lg p-3">
                  <h4 className="font-semibold text-purple-200 mb-2">
                    📝 Data Entry
                  </h4>
                  <ul className="text-purple-100 text-sm space-y-1">
                    <li>• Financial transactions</li>
                    <li>• Expense records</li>
                    <li>• Revenue data</li>
                    <li>• Budget information</li>
                  </ul>
                </div>
                <div className="bg-blue-500/30 rounded-lg p-3">
                  <h4 className="font-semibold text-blue-200 mb-2">
                    ⚙️ Processing
                  </h4>
                  <ul className="text-blue-100 text-sm space-y-1">
                    <li>• Journal entries</li>
                    <li>• Account reconciliation</li>
                    <li>• Budget calculations</li>
                    <li>• Financial analysis</li>
                  </ul>
                </div>
                <div className="bg-green-500/30 rounded-lg p-3">
                  <h4 className="font-semibold text-green-200 mb-2">
                    📊 Output
                  </h4>
                  <ul className="text-green-100 text-sm space-y-1">
                    <li>• Financial statements</li>
                    <li>• Budget reports</li>
                    <li>• Cash flow analysis</li>
                    <li>• Audit trails</li>
                  </ul>
                </div>
                <div className="bg-orange-500/30 rounded-lg p-3">
                  <h4 className="font-semibold text-orange-200 mb-2">
                    ✅ Approval
                  </h4>
                  <ul className="text-orange-100 text-sm space-y-1">
                    <li>• Financial approvals</li>
                    <li>• Budget approvals</li>
                    <li>• Expense approvals</li>
                    <li>• Audit approvals</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Communication Flow */}
            <div className="bg-gradient-to-r from-indigo-600/20 to-purple-600/20 border border-indigo-400 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-indigo-200 mb-4 flex items-center">
                <span className="mr-2">💬</span>
                Communication Process Flow
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-purple-500/30 rounded-lg p-3">
                  <h4 className="font-semibold text-purple-200 mb-2">
                    📝 Data Entry
                  </h4>
                  <ul className="text-purple-100 text-sm space-y-1">
                    <li>• Messages & announcements</li>
                    <li>• Meeting requests</li>
                    <li>• File uploads</li>
                    <li>• Collaboration data</li>
                  </ul>
                </div>
                <div className="bg-blue-500/30 rounded-lg p-3">
                  <h4 className="font-semibold text-blue-200 mb-2">
                    ⚙️ Processing
                  </h4>
                  <ul className="text-blue-100 text-sm space-y-1">
                    <li>• Message routing</li>
                    <li>• Notification generation</li>
                    <li>• File processing</li>
                    <li>• Thread management</li>
                  </ul>
                </div>
                <div className="bg-green-500/30 rounded-lg p-3">
                  <h4 className="font-semibold text-green-200 mb-2">
                    📊 Output
                  </h4>
                  <ul className="text-green-100 text-sm space-y-1">
                    <li>• Delivered messages</li>
                    <li>• Meeting schedules</li>
                    <li>• Shared files</li>
                    <li>• Communication logs</li>
                  </ul>
                </div>
                <div className="bg-orange-500/30 rounded-lg p-3">
                  <h4 className="font-semibold text-orange-200 mb-2">
                    ✅ Approval
                  </h4>
                  <ul className="text-orange-100 text-sm space-y-1">
                    <li>• Message approvals</li>
                    <li>• Announcement approvals</li>
                    <li>• File sharing permissions</li>
                    <li>• Meeting scheduling</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Cross-Module Integration */}
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 mb-8">
          <h2 className="text-2xl font-semibold text-white mb-6">
            Cross-Module Integration Examples
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gradient-to-r from-emerald-600/20 to-teal-600/20 border border-emerald-400 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-emerald-200 mb-3">
                🔄 HR → Payroll → Accounting
              </h3>
              <div className="text-emerald-100 text-sm space-y-2">
                <p>
                  <strong>Data Entry:</strong> Employee hired in HR
                </p>
                <p>
                  <strong>Processing:</strong> Salary data flows to Payroll
                </p>
                <p>
                  <strong>Output:</strong> Payroll generates salary payments
                </p>
                <p>
                  <strong>Approval:</strong> Accounting approves and records
                  transactions
                </p>
              </div>
            </div>

            <div className="bg-gradient-to-r from-amber-600/20 to-orange-600/20 border border-amber-400 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-amber-200 mb-3">
                🔄 Procurement → Accounting → Communication
              </h3>
              <div className="text-amber-100 text-sm space-y-2">
                <p>
                  <strong>Data Entry:</strong> Purchase request in Procurement
                </p>
                <p>
                  <strong>Processing:</strong> Accounting processes payment
                </p>
                <p>
                  <strong>Output:</strong> Purchase order generated
                </p>
                <p>
                  <strong>Approval:</strong> Communication notifies stakeholders
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* General Requirements */}
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
          <h2 className="text-2xl font-semibold text-white mb-4">
            General Requirements (Cross-Module)
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-xl font-semibold text-yellow-300 mb-3">
                📄 Document Management
              </h3>
              <ul className="text-white space-y-2">
                <li>
                  • <strong>Universal Access:</strong> All modules can create,
                  view, and manage documents
                </li>
                <li>
                  • <strong>Permission-based:</strong> Users see documents based
                  on their role and department
                </li>
                <li>
                  • <strong>Workflow Integration:</strong> Documents trigger
                  approval processes across modules
                </li>
                <li>
                  • <strong>Version Control:</strong> Track changes and maintain
                  document history
                </li>
                <li>
                  • <strong>Search & Retrieval:</strong> Advanced search across
                  all document types
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-purple-300 mb-3">
                💬 Messaging System
              </h3>
              <ul className="text-white space-y-2">
                <li>
                  • <strong>Cross-Module Communication:</strong> Users can
                  message across all departments
                </li>
                <li>
                  • <strong>Permission-based:</strong> Access to messaging based
                  on user roles
                </li>
                <li>
                  • <strong>Document Sharing:</strong> Attach documents to
                  messages
                </li>
                <li>
                  • <strong>Notification Integration:</strong> Real-time alerts
                  for approvals and updates
                </li>
                <li>
                  • <strong>Thread Management:</strong> Organize conversations
                  by topic or project
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-orange-300 mb-3">
                🛒 Procurement Integration
              </h3>
              <ul className="text-white space-y-2">
                <li>
                  • <strong>Document-driven:</strong> Purchase orders, invoices,
                  and contracts as documents
                </li>
                <li>
                  • <strong>Approval Workflows:</strong> Multi-level approval
                  processes
                </li>
                <li>
                  • <strong>Vendor Communication:</strong> Messaging system for
                  vendor interactions
                </li>
                <li>
                  • <strong>Financial Integration:</strong> Automatic posting to
                  accounting modules
                </li>
                <li>
                  • <strong>Audit Trail:</strong> Complete history of
                  procurement activities
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-cyan-300 mb-3">
                🔐 Security & Compliance
              </h3>
              <ul className="text-white space-y-2">
                <li>
                  • <strong>Role-based Access:</strong> Granular permissions
                  across all modules
                </li>
                <li>
                  • <strong>Data Encryption:</strong> Secure storage and
                  transmission
                </li>
                <li>
                  • <strong>Audit Logging:</strong> Track all user activities
                  and changes
                </li>
                <li>
                  • <strong>Compliance Reporting:</strong> Generate reports for
                  regulatory requirements
                </li>
                <li>
                  • <strong>Backup & Recovery:</strong> Automated data
                  protection
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ERPFlowchart;
