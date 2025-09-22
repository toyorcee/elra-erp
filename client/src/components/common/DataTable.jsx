import React, { useState, useMemo } from "react";
import {
  HiPencil,
  HiTrash,
  HiChevronLeft,
  HiChevronRight,
} from "react-icons/hi";

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
  pagination = true,
  itemsPerPage = 10,
  searchable = false,
  sortable = false,
  onItemsPerPageChange = null,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });

  // Filter data based on search term
  const filteredData = useMemo(() => {
    if (!searchable || !searchTerm) return data;

    return data.filter((item) => {
      return columns.some((column) => {
        const value = item[column.accessor];
        if (typeof value === "string") {
          return value.toLowerCase().includes(searchTerm.toLowerCase());
        }
        if (typeof value === "object" && value !== null) {
          return JSON.stringify(value)
            .toLowerCase()
            .includes(searchTerm.toLowerCase());
        }
        return false;
      });
    });
  }, [data, searchTerm, searchable, columns]);

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortable || !sortConfig.key) return filteredData;

    return [...filteredData].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      if (aValue < bValue) {
        return sortConfig.direction === "asc" ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === "asc" ? 1 : -1;
      }
      return 0;
    });
  }, [filteredData, sortConfig, sortable]);

  // Paginate data
  const paginatedData = useMemo(() => {
    if (!pagination) return sortedData;

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return sortedData.slice(startIndex, endIndex);
  }, [sortedData, currentPage, itemsPerPage, pagination]);

  // Calculate pagination info
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const totalItems = filteredData.length;
  const startItem = pagination ? (currentPage - 1) * itemsPerPage + 1 : 1;
  const endItem = pagination
    ? Math.min(currentPage * itemsPerPage, totalItems)
    : totalItems;

  // Handle sort
  const handleSort = (key) => {
    if (!sortable) return;

    setSortConfig((prevConfig) => ({
      key,
      direction:
        prevConfig.key === key && prevConfig.direction === "asc"
          ? "desc"
          : "asc",
    }));
  };

  // Handle page change
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  // Reset to first page when search changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);
  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto max-w-full">
          <table className="w-full table-fixed min-w-0">
            <thead className="bg-gradient-to-r from-[var(--elra-primary)] to-[var(--elra-primary-dark)] text-white">
              <tr>
                {columns.map((column, index) => (
                  <th
                    key={index}
                    className={`px-6 py-4 text-left font-semibold ${
                      column.align === "center" ? "text-center" : ""
                    } ${column.width || "w-auto"}`}
                  >
                    {column.header}
                  </th>
                ))}
                {actions.showEdit ||
                actions.showDelete ||
                actions.showToggle ||
                actions.customActions ? (
                  <th className="px-6 py-4 text-center font-semibold w-24">
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
                        <div
                          className={`h-4 bg-gray-200 rounded ${
                            column.width || "w-24"
                          }`}
                        ></div>
                      )}
                    </td>
                  ))}
                  {actions.showEdit ||
                  actions.showDelete ||
                  actions.showToggle ||
                  actions.customActions ? (
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
                        {actions.customActions && (
                          <>
                            <div className="w-8 h-8 bg-gray-200 rounded"></div>
                            <div className="w-8 h-8 bg-gray-200 rounded"></div>
                          </>
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
      {/* Table Header with Pagination Info */}
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          {/* Left side - Results info */}
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-700">
              <span className="font-medium">{totalItems}</span> total items
            </div>
            {pagination && totalPages > 1 && (
              <div className="text-sm text-gray-600">
                Page <span className="font-medium">{currentPage}</span> of{" "}
                <span className="font-medium">{totalPages}</span>
              </div>
            )}
          </div>

          {/* Right side - Items per page selector */}
          {pagination && (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Show:</span>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  const newItemsPerPage = parseInt(e.target.value);
                  setCurrentPage(1);
                  if (onItemsPerPageChange) {
                    onItemsPerPageChange(newItemsPerPage);
                  }
                }}
                className="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-[var(--elra-primary)]"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <span className="text-sm text-gray-600">per page</span>
            </div>
          )}
        </div>
      </div>

      {/* Search Bar */}
      {searchable && (
        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <input
              type="text"
              placeholder="Search by project name, code, department, or creator..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--elra-primary)] focus:border-transparent"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg
                className="h-5 w-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
          </div>
        </div>
      )}

      <div className="overflow-x-auto max-w-full">
        <table className="w-full table-fixed min-w-0">
          <thead className="bg-gradient-to-r from-[var(--elra-primary)] to-[var(--elra-primary-dark)] text-white">
            <tr>
              {columns.map((column, index) => (
                <th
                  key={index}
                  className={`px-6 py-4 text-left font-semibold ${
                    column.align === "center" ? "text-center" : ""
                  } ${
                    sortable
                      ? "cursor-pointer hover:bg-[var(--elra-primary-dark)]"
                      : ""
                  } ${column.width || "w-auto"}`}
                  onClick={
                    sortable ? () => handleSort(column.accessor) : undefined
                  }
                >
                  <div className="flex items-center space-x-1">
                    <span>{column.header}</span>
                    {sortable && sortConfig.key === column.accessor && (
                      <span className="text-xs">
                        {sortConfig.direction === "asc" ? "↑" : "↓"}
                      </span>
                    )}
                  </div>
                </th>
              ))}
              {actions.showEdit ||
              actions.showDelete ||
              actions.showToggle ||
              actions.customActions ? (
                <th className="px-6 py-4 text-center font-semibold w-24">
                  Actions
                </th>
              ) : null}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {paginatedData.map((row, rowIndex) => (
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
                    {column.renderer
                      ? column.renderer(row)
                      : typeof row[column.accessor] === "object"
                      ? JSON.stringify(row[column.accessor])
                      : row[column.accessor] || row[column.key] || ""}
                  </td>
                ))}
                {(actions.showEdit ||
                  actions.showDelete ||
                  actions.showToggle ||
                  actions.customActions) && (
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center space-x-2">
                      {actions.customActions ? (
                        actions.customActions(row)
                      ) : (
                        <>
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
                                  row.isActive
                                    ? "translate-x-6"
                                    : "translate-x-1"
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
                        </>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {pagination && (
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            {/* Results Info */}
            <div className="text-sm text-gray-700">
              Showing <span className="font-medium">{startItem}</span> to{" "}
              <span className="font-medium">{endItem}</span> of{" "}
              <span className="font-medium">{totalItems}</span> results
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center space-x-2">
              {totalPages > 1 ? (
                <>
                  {/* Previous Button */}
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 hover:border-[var(--elra-primary)] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:border-gray-300"
                  >
                    <HiChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                  </button>

                  {/* Page Numbers */}
                  <div className="flex items-center space-x-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }

                      return (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          className={`inline-flex items-center justify-center w-10 h-10 text-sm font-medium ${
                            currentPage === pageNum
                              ? "bg-[var(--elra-primary)] text-white shadow-md"
                              : "text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 hover:border-[var(--elra-primary)]"
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>

                  {/* Next Button */}
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 hover:border-[var(--elra-primary)] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:border-gray-300"
                  >
                    Next
                    <HiChevronRight className="h-4 w-4 ml-1" />
                  </button>
                </>
              ) : (
                <div className="text-sm text-gray-500 font-medium">
                  Page 1 of 1
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataTable;
