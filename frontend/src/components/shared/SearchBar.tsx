/**
 * SearchBar - Premium search with autocomplete
 */

import React, { useState, useRef, useEffect } from 'react';
import { Search, X, Loader2 } from 'lucide-react';
import { Input } from '../ui/input';
import { useDebounce } from '../../hooks/useDebounce';
import { searchCars, type Car } from '../../api/cars';
import { cn } from '@/lib/utils';

interface SearchBarProps {
  onSearch?: (query: string) => void;
  onCarSelect?: (car: Car) => void;
  placeholder?: string;
  className?: string;
}

export function SearchBar({
  onSearch,
  onCarSelect,
  placeholder = 'Search by brand, model, or code...',
  className,
}: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [results, setResults] = useState<Car[]>([]);
  const [loading, setLoading] = useState(false);
  const debouncedQuery = useDebounce(query, 300);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    async function search() {
      setLoading(true);
      const response = await searchCars(debouncedQuery);
      setLoading(false);

      if (response.data?.cars) {
        setResults(response.data.cars);
        setIsOpen(true);
      }
    }

    search();
  }, [debouncedQuery]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    onSearch?.(value);
  };

  const handleClear = () => {
    setQuery('');
    setResults([]);
    setIsOpen(false);
    onSearch?.('');
  };

  const handleSelectCar = (car: Car) => {
    setQuery('');
    setIsOpen(false);
    onCarSelect?.(car);
  };

  const formatPrice = (price: string | number) => {
    const numPrice = typeof price === 'string' ? parseInt(price) : price;
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(numPrice);
  };

  return (
    <div ref={containerRef} className={cn('relative w-full', className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          type="text"
          value={query}
          onChange={handleInputChange}
          placeholder={placeholder}
          className="pl-9 pr-9 h-11 rounded-full shadow-sm transition-all duration-200 focus:shadow-md"
          aria-label="Search cars"
        />
        {query && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Clear search"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <X className="h-4 w-4" />
            )}
          </button>
        )}
      </div>

      {/* Autocomplete Dropdown */}
      {isOpen && results.length > 0 && (
        <div className="absolute top-full mt-2 w-full bg-background border rounded-xl shadow-lg overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="max-h-80 overflow-y-auto">
            {results.map((car) => (
              <button
                key={car.id}
                onClick={() => handleSelectCar(car)}
                className="w-full flex items-start gap-3 p-3 hover:bg-accent transition-colors text-left"
              >
                {car.photos[car.primaryPhotoIndex] && (
                  <img
                    src={car.photos[car.primaryPhotoIndex]}
                    alt={car.publicName}
                    className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{car.publicName}</p>
                  <p className="text-xs text-muted-foreground">
                    {car.year} • {car.km.toLocaleString('id-ID')} km • {car.transmission}
                  </p>
                  <p className="text-sm font-semibold text-primary mt-1">
                    {formatPrice(car.price)}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {isOpen && query && results.length === 0 && !loading && (
        <div className="absolute top-full mt-2 w-full bg-background border rounded-xl shadow-lg p-4 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          <p className="text-sm text-muted-foreground text-center">No cars found</p>
        </div>
      )}
    </div>
  );
}
