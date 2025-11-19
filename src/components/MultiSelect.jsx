import { useState, useRef, useEffect } from 'react';

const MultiSelect = ({ options, selected, onChange, placeholder, onAddCustom, className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const wrapperRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const filteredOptions = options.filter(option =>
    option.toLowerCase().includes(searchTerm.toLowerCase()) &&
    !selected.includes(option)
  );

  const toggleOption = (option) => {
    if (selected.includes(option)) {
      onChange(selected.filter(item => item !== option));
    } else {
      onChange([...selected, option]);
    }
  };

  const removeOption = (option) => {
    onChange(selected.filter(item => item !== option));
  };

  return (
    <div className={`relative ${className}`} ref={wrapperRef}>
      <div
        className="w-full min-h-[48px] px-4 py-2 rounded-xl border border-gray-200 bg-white focus-within:ring-2 focus-within:ring-teal-500 focus-within:border-transparent cursor-text"
        onClick={() => setIsOpen(!isOpen)}
      >
        {selected.length === 0 ? (
          <span className="text-gray-400 text-sm">{placeholder}</span>
        ) : (
          <div className="flex flex-wrap gap-2">
            {selected.map((item) => (
              <span
                key={item}
                className="inline-flex items-center gap-1 px-2 py-1 bg-teal-100 text-teal-700 rounded-lg text-xs"
              >
                {item}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeOption(item);
                  }}
                  className="hover:text-teal-900"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white rounded-xl shadow-xl border border-gray-200 max-h-60 overflow-y-auto">
          <div className="p-2 border-b border-gray-200">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Поиск..."
              className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          <div className="max-h-48 overflow-y-auto">
            {filteredOptions.map((option, index) => (
              <button
                key={index}
                type="button"
                onClick={() => toggleOption(option)}
                className={`w-full text-left px-4 py-2 hover:bg-teal-50 transition-colors text-sm flex items-center ${
                  selected.includes(option) ? 'bg-teal-50' : ''
                }`}
              >
                <span className={`w-4 h-4 border-2 rounded mr-2 flex items-center justify-center ${
                  selected.includes(option) ? 'bg-teal-500 border-teal-500' : 'border-gray-300'
                }`}>
                  {selected.includes(option) && <span className="text-white text-xs">✓</span>}
                </span>
                {option}
              </button>
            ))}
          </div>
          {onAddCustom && searchTerm && !options.includes(searchTerm) && !selected.includes(searchTerm) && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onAddCustom(searchTerm);
                setSearchTerm('');
              }}
              className="w-full text-left px-4 py-2 hover:bg-teal-50 border-t border-gray-200 text-teal-600 font-medium text-sm"
            >
              + Добавить "{searchTerm}"
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default MultiSelect;

