// @ts-nocheck
import React, { useState } from 'react';
import { MapPin, Search, Loader2, Navigation } from 'lucide-react';
import { Button } from './button';

export function LocationSearchBar({ onLocationFound, isLoading = false }) {
  const [locationInput, setLocationInput] = useState('');
  const [speciesInput, setSpeciesInput] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [error, setError] = useState(null);

  // Helper to validate species input - returns error message if invalid
  const validateSpeciesInput = () => {
    const trimmed = speciesInput.trim();
    // Species name is now required - cannot be blank or whitespace
    if (trimmed.length === 0) {
      return 'Please enter a species name';
    }
    return null;
  };

  // Helper to safely get species value - returns null if empty, trimmed value if valid
  const getValidSpeciesInput = () => {
    const trimmed = speciesInput.trim();
    return trimmed.length > 0 ? trimmed : null;
  };

  const handleLocateMe = async () => {
    setError(null);

    // Validate species input
    const speciesError = validateSpeciesInput();
    if (speciesError) {
      setError(speciesError);
      return;
    }

    setIsLocating(true);

    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      setIsLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        console.log('Geolocation result:', { latitude, longitude });
        setIsLocating(false);
        onLocationFound(latitude, longitude, getValidSpeciesInput());
      },
      (err) => {
        setIsLocating(false);
        setError('Unable to retrieve your location. Please check browser permissions.');
        console.error('Geolocation error:', err);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  const handleSearch = async () => {
    const query = locationInput.trim();
    if (!query) {
      setError('Please enter a zip code or city name');
      return;
    }

    // Validate species input
    const speciesError = validateSpeciesInput();
    if (speciesError) {
      setError(speciesError);
      return;
    }

    setError(null);
    setIsSearching(true);

    const mapboxToken = import.meta.env.VITE_MAPBOX_TOKEN;
    if (!mapboxToken) {
      setIsSearching(false);
      setError(
        'Location search is not configured correctly. Please contact support or an administrator.'
      );
      console.error('Mapbox token (VITE_MAPBOX_TOKEN) is missing or empty.');
      return;
    }

    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
          query
        )}.json?access_token=${mapboxToken}&limit=1`
      );

      if (!response.ok) {
        throw new Error('Geocoding request failed');
      }

      const data = await response.json();
      console.log('Mapbox geocoding result:', data);

      if (data.features && data.features.length > 0) {
        const [lng, lat] = data.features[0].center;
        const placeName = data.features[0].place_name;
        console.log('Using coordinates:', { lat, lng, placeName });
        setIsSearching(false);
        onLocationFound(lat, lng, getValidSpeciesInput(), placeName);
      } else {
        setIsSearching(false);
        setError('Location not found. Please try a different search.');
      }
    } catch (err) {
      setIsSearching(false);
      setError('Failed to search location. Please try again.');
      console.error('Geocoding error:', err);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !isSearching && !isLocating) {
      handleSearch();
    }
  };

  return (
    <div className="w-full space-y-3">
      {/* Location Input */}
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input
          type="text"
          placeholder="Zip code or city name..."
          value={locationInput}
          onChange={(e) => setLocationInput(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={isSearching || isLocating || isLoading}
          className="w-full bg-slate-800/50 border border-slate-700/50 rounded-lg pl-10 pr-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all disabled:opacity-50"
        />
      </div>

      {/* Species Input (Optional) */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input
          type="text"
          placeholder="Species name..."
          value={speciesInput}
          onChange={(e) => setSpeciesInput(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={isSearching || isLocating || isLoading}
          className="w-full bg-slate-800/50 border border-slate-700/50 rounded-lg pl-10 pr-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all disabled:opacity-50"
        />
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <Button
          onClick={handleLocateMe}
          disabled={isSearching || isLocating || isLoading}
          className="flex-1 bg-slate-700 hover:bg-slate-600 text-white border-0"
        >
          {isLocating ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Locating...
            </>
          ) : (
            <>
              <Navigation className="w-4 h-4 mr-2" />
              Locate Me
            </>
          )}
        </Button>

        <Button
          onClick={handleSearch}
          disabled={isSearching || isLocating || isLoading || !locationInput.trim()}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white border-0"
        >
          {isSearching ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Searching...
            </>
          ) : (
            <>
              <Search className="w-4 h-4 mr-2" />
              Search
            </>
          )}
        </Button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg p-2">
          {error}
        </div>
      )}
    </div>
  );
}
