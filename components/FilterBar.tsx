
import React from 'react';
import { Filters } from '../types';

interface FilterBarProps {
  filters: Filters;
  availableYears: string[];
  availableTags: string[];
  onFilterChange: (newFilters: Filters) => void;
}

const FilterBar: React.FC<FilterBarProps> = ({ filters, availableYears, availableTags, onFilterChange }) => {
  return (
    <div className="flex flex-wrap gap-4 mb-8 items-center bg-gray-50 p-4 rounded-lg">
      <div className="flex items-center gap-2">
        <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Year:</span>
        <select 
          className="bg-white border border-gray-200 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-black"
          value={filters.year}
          onChange={(e) => onFilterChange({ ...filters, year: e.target.value })}
        >
          <option value="">All Years</option>
          {availableYears.map(year => (
            <option key={year} value={year}>{year}</option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Tag:</span>
        <select 
          className="bg-white border border-gray-200 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-black"
          value={filters.tag}
          onChange={(e) => onFilterChange({ ...filters, tag: e.target.value })}
        >
          <option value="">All Tags</option>
          {availableTags.map(tag => (
            <option key={tag} value={tag}>{tag}</option>
          ))}
        </select>
      </div>

      {(filters.year || filters.tag) && (
        <button 
          onClick={() => onFilterChange({ year: '', tag: '' })}
          className="text-xs font-medium text-red-500 hover:text-red-700 underline"
        >
          Clear Filters
        </button>
      )}
    </div>
  );
};

export default FilterBar;
