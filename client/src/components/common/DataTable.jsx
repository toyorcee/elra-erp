import React from "react";
import { HiPencil, HiTrash } from "react-icons/hi";

const DataTable = ({
  data = [],
  columns = [],
  loading = false,
  emptyState = {
    icon: null,
    title: "No data found",
    description: "Get started by creating your first item",
    actionButton: null,
  },
  actions = {
    onEdit: null,
    onDelete: null,
    onToggle: null,
    showEdit: true,
    showDelete: true,
    showToggle: false,
  },
  skeletonRows = 5,
  onRowClick = null,
  rowClassName = "",
}) => {
  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-[var(--elra-primary)] to-[var(--elra-primary-dark)] text-white">
              <tr>
                {columns.map((column, index) => (
                  <th
                    key={index}
                    className={`px-6 py-4 text-left font-semibold ${
                      column.align === "center" ? "text-center" : ""
                    }`}
                  >
                    {column.header}
                  </th>
                ))}
                {actions.showEdit ||
                actions.showDelete ||
                actions.showToggle ? (
                  <th className="px-6 py-4 text-center font-semibold">
                    Actions
                  </th>
                ) : null}
              </tr>
            </thead>
            <tbody>
              {[...Array(skeletonRows)].map((_, index) => (
                <tr key={index} className="animate-pulse">
                  {columns.map((column, colIndex) => (
                    <td key={colIndex} className="px-6 py-4">
                      {column.skeletonRenderer ? (
                        column.skeletonRenderer()
                      ) : (
                        <div className="h-4 bg-gray-200 rounded w-32"></div>
                      )}
                    </td>
                  ))}
                  {actions.showEdit ||
                  actions.showDelete ||
                  actions.showToggle ? (
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center space-x-2">
                        {actions.showEdit && (
                          <div className="w-8 h-8 bg-gray-200 rounded"></div>
                        )}
                        {actions.showToggle && (
                          <div className="w-8 h-8 bg-gray-200 rounded"></div>
                        )}
                        {actions.showDelete && (
                          <div className="w-8 h-8 bg-gray-200 rounded"></div>
                        )}
                      </div>
                    </td>
                  ) : null}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="p-12 text-center">
          {emptyState.icon && (
            <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-[var(--elra-primary)] to-[var(--elra-primary-dark)] rounded-full mb-6">
              {emptyState.icon}
            </div>
          )}
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {emptyState.title}
          </h3>
          <p className="text-gray-600 mb-6">{emptyState.description}</p>
          {emptyState.actionButton}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gradient-to-r from-[var(--elra-primary)] to-[var(--elra-primary-dark)] text-white">
            <tr>
              {columns.map((column, index) => (
                <th
                  key={index}
                  className={`px-6 py-4 text-left font-semibold ${
                    column.align === "center" ? "text-center" : ""
                  }`}
                >
                  {column.header}
                </th>
              ))}
              {actions.showEdit || actions.showDelete || actions.showToggle ? (
                <th className="px-6 py-4 text-center font-semibold">Actions</th>
              ) : null}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {data.map((row, rowIndex) => (
              <tr
                key={row._id || rowIndex}
                className={`${
                  typeof rowClassName === "function"
                    ? rowClassName(row)
                    : rowClassName
                } ${
                  onRowClick ? "cursor-pointer" : ""
                } hover:bg-gray-50 transition-colors`}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
              >
                {columns.map((column, colIndex) => (
                  <td key={colIndex} className="px-6 py-4">
                    {column.renderer ? column.renderer(row) : row[column.key]}
                  </td>
                ))}
                {(actions.showEdit ||
                  actions.showDelete ||
                  actions.showToggle) && (
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center space-x-2">
                      {actions.showEdit && actions.onEdit && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            actions.onEdit(row);
                          }}
                          className="p-2 text-[var(--elra-primary)] hover:bg-[var(--elra-primary)] hover:text-white rounded-lg transition-colors"
                          title="Edit"
                        >
                          <HiPencil className="w-4 h-4" />
                        </button>
                      )}
                      {actions.showToggle && actions.onToggle && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            actions.onToggle(row);
                          }}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--elra-primary)] focus:ring-offset-2 ${
                            row.isActive
                              ? "bg-[var(--elra-primary)]"
                              : "bg-gray-200"
                          }`}
                          title={row.isActive ? "Deactivate" : "Activate"}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              row.isActive ? "translate-x-6" : "translate-x-1"
                            }`}
                          />
                        </button>
                      )}
                      {actions.showDelete && actions.onDelete && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            actions.onDelete(
                              row._id || row.id,
                              row.name || row.grade
                            );
                          }}
                          className="p-2 text-red-500 hover:bg-red-500 hover:text-white rounded-lg transition-colors"
                          title="Delete"
                        >
                          <HiTrash className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DataTable;
