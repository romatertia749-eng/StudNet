import { useState, useRef, useEffect } from 'react';

const Autocomplete = ({ options, value, onChange, placeholder, className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredOptions, setFilteredOptions] = useState(options);
  const wrapperRef = useRef(null);

  useEffect(() => {
    if (searchTerm) {
      const filtered = options.filter(option =>
        option.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredOptions(filtered);
    } else {
      setFilteredOptions(options.slice(0, 50));
    }
  }, [searchTerm, options]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (option) => {
    onChange(option);
    setSearchTerm(option);
    setIsOpen(false);
  };

  const handleInputChange = (e) => {
    setSearchTerm(e.target.value);
    setIsOpen(true);
    if (!e.target.value) {
      onChange('');
    }
  };

  return (
    <div className={`relative ${className}`} ref={wrapperRef}>
      <input
        type="text"
        value={searchTerm || value}
        onChange={handleInputChange}
        onFocus={() => setIsOpen(true)}
        placeholder={placeholder}
        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
      />
      {isOpen && filteredOptions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white rounded-xl shadow-xl border border-gray-200 max-h-60 overflow-y-auto">
          {filteredOptions.map((option, index) => (
            <button
              key={index}
              type="button"
              onClick={() => handleSelect(option)}
              className="w-full text-left px-4 py-3 hover:bg-teal-50 transition-colors text-sm"
            >
              {option}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default Autocomplete;

