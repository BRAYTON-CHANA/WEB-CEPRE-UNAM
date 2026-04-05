import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, Marker, Popup, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import BaseInput from './BaseInput';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

/**
 * Componente LocationInput especializado
 * Combina input de texto para coordenadas con mapa interactivo real usando React-Leaflet
 * Sincronización bidireccional entre input y mapa
 */
const LocationInput = ({ 
  // Props específicas de ubicación
  showMap = true,
  mapHeight = 500,
  allowCurrentLocation = true,
  mapProvider = 'openstreetmap', // 'openstreetmap', 'google', 'mapbox'
  mapApiKey = null,
  
  // Props de validación
  validateOnBlur = true,
  showValidationErrors = true,
  
  // Pasar todas las demás props al BaseInput
  ...baseInputProps 
}) => {
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const [coordinates, setCoordinates] = useState({
    lat: -12.0464, // Default: Lima, Perú
    lng: -77.0428
  });
  const [inputValue, setInputValue] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [mapReady, setMapReady] = useState(false);

  // Coordenadas por defecto
  const DEFAULT_COORDINATES = {
    lat: -12.0464, // Lima, Perú
    lng: -77.0428
  };

  // Rangos válidos de coordenadas
  const COORDINATE_RANGES = {
    latitude: { min: -90, max: 90 },
    longitude: { min: -180, max: 180 }
  };

  // Mensajes de error
  const LOCATION_ERROR_MESSAGES = {
    INVALID_FORMAT: 'Formato inválido. Usa: latitud, longitud (ej: 19.4326, -99.1332)',
    INVALID_LATITUDE: 'Latitud debe estar entre -90° y 90°',
    INVALID_LONGITUDE: 'Longitud debe estar entre -180° y 180°'
  };

  // Validar coordenadas
  const validateCoordinates = (lat, lng) => {
    const errors = [];
    
    if (typeof lat !== 'number' || isNaN(lat)) {
      errors.push('La latitud debe ser un número');
    } else if (lat < COORDINATE_RANGES.latitude.min || lat > COORDINATE_RANGES.latitude.max) {
      errors.push(LOCATION_ERROR_MESSAGES.INVALID_LATITUDE);
    }
    
    if (typeof lng !== 'number' || isNaN(lng)) {
      errors.push('La longitud debe ser un número');
    } else if (lng < COORDINATE_RANGES.longitude.min || lng > COORDINATE_RANGES.longitude.max) {
      errors.push(LOCATION_ERROR_MESSAGES.INVALID_LONGITUDE);
    }
    
    return {
      isValid: errors.length === 0,
      errors: errors
    };
  };

  // Parsear coordenadas desde texto
  const parseCoordinates = (text) => {
    if (!text || typeof text !== 'string') return null;
    
    const parts = text.split(',').map(part => part.trim());
    if (parts.length !== 2) return null;
    
    const lat = parseFloat(parts[0]);
    const lng = parseFloat(parts[1]);
    
    if (isNaN(lat) || isNaN(lng)) return null;
    
    return { lat, lng };
  };

  // Formatear coordenadas para mostrar
  const formatCoordinates = (lat, lng) => {
    return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  };

  // Obtener ubicación actual del navegador
  const getCurrentLocation = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocalización no soportada por este navegador'));
        return;
      }
      
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newCoords = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          
          // Mover el mapa a la nueva ubicación
          if (mapInstanceRef.current) {
            mapInstanceRef.current.flyTo([newCoords.lat, newCoords.lng], 14);
          }
          
          resolve(newCoords);
        },
        (error) => {
          reject(new Error(error.message));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000
        }
      );
    });
  };

  // Inicializar con valor por defecto o proporcionado
  useEffect(() => {
    if (baseInputProps.value) {
      const parsed = parseCoordinates(baseInputProps.value);
      if (parsed) {
        setCoordinates(parsed);
        setInputValue(formatCoordinates(parsed.lat, parsed.lng));
      }
    } else if (baseInputProps.defaultValue) {
      const parsed = parseCoordinates(baseInputProps.defaultValue);
      if (parsed) {
        setCoordinates(parsed);
        setInputValue(formatCoordinates(parsed.lat, parsed.lng));
      }
    }
  }, []);

  // Validar coordenadas
  const validateInput = (value) => {
    if (!value) return '';
    
    const parsed = parseCoordinates(value);
    if (!parsed) {
      return LOCATION_ERROR_MESSAGES.INVALID_FORMAT;
    }
    
    const validation = validateCoordinates(parsed.lat, parsed.lng);
    if (!validation.isValid) {
      return validation.errors.join(', ');
    }
    
    return '';
  };

  // Manejar cambio en el input de texto
  const handleInputChange = (name, value) => {
    console.log('🌍 LocationInput handleInputChange:', name, value);
    setInputValue(value);
    setError(''); // Limpiar error al escribir
    
    // Intentar parsear coordenadas
    const parsed = parseCoordinates(value);
    if (parsed) {
      const validation = validateCoordinates(parsed.lat, parsed.lng);
      if (validation.isValid) {
        setCoordinates(parsed);
        // Notificar al padre con formato completo
        const formatted = formatCoordinates(parsed.lat, parsed.lng);
        console.log('🌍 LocationInput llamando a onChange con:', formatted);
        baseInputProps.onChange(name, formatted);
      }
    }
  };

  // Manejar blur del input
  const handleInputBlur = (name) => {
    if (validateOnBlur) {
      const errorMsg = validateInput(inputValue);
      setError(errorMsg);
    }
    
    if (baseInputProps.onBlur) {
      baseInputProps.onBlur(name);
    }
  };

  // Manejar click en el mapa
  const handleMapClick = (e) => {
    const { lat, lng } = e.latlng;
    console.log('🗺️ Click en mapa:', lat, lng);
    const validation = validateCoordinates(lat, lng);
    if (validation.isValid) {
      setCoordinates({ lat, lng });
      const formatted = formatCoordinates(lat, lng);
      setInputValue(formatted);
      console.log('🗺️ Mapa llamando a onChange con:', formatted);
      baseInputProps.onChange(baseInputProps.name, formatted);
      setError('');
    }
  };

  // Manejar arrastre del marker
  const handleMarkerDrag = (e) => {
    const { lat, lng } = e.target.getLatLng();
    console.log('📍 Marker arrastrado:', lat, lng);
    const validation = validateCoordinates(lat, lng);
    if (validation.isValid) {
      setCoordinates({ lat, lng });
      const formatted = formatCoordinates(lat, lng);
      setInputValue(formatted);
      console.log('📍 Marker llamando a onChange con:', formatted);
      baseInputProps.onChange(baseInputProps.name, formatted);
      setError('');
    }
  };

  // Obtener ubicación actual
  const handleGetCurrentLocation = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      const location = await getCurrentLocation();
      setCoordinates({ lat: location.lat, lng: location.lng });
      const formatted = formatCoordinates(location.lat, location.lng);
      setInputValue(formatted);
      baseInputProps.onChange(baseInputProps.name, formatted);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Componente de eventos del mapa
  const MapEvents = () => {
    useMapEvents({
      click: handleMapClick,
    });
    return null;
  };

  // Componente para obtener la instancia del mapa
  const MapInstance = () => {
    const map = useMap();
    useEffect(() => {
      if (map && !mapInstanceRef.current) {
        mapInstanceRef.current = map;
      }
    }, [map]);
    return null;
  };

  // Renderizar mapa con React-Leaflet
  const renderMap = () => {
    if (!showMap) return null;

    return (
      <div className="mt-4">
        <div className="text-sm font-medium text-gray-700 mb-2">
          Mapa Interactivo
        </div>
        
        <div 
          className="relative rounded-lg overflow-hidden border-2 border-gray-300"
          style={{ height: `${mapHeight}px` }}
        >
          <MapContainer
            center={[coordinates.lat, coordinates.lng]}
            zoom={13}
            style={{ height: '100%', width: '100%' }}
            ref={mapRef}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            
            <Marker
              position={[coordinates.lat, coordinates.lng]}
              draggable={true}
              ref={markerRef}
              eventHandlers={{
                dragend: handleMarkerDrag,
              }}
            >
              <Popup>
                <div className="text-center">
                  <div className="font-medium">Coordenadas</div>
                  <div className="font-mono text-sm">
                    {formatCoordinates(coordinates.lat, coordinates.lng)}
                  </div>
                </div>
              </Popup>
            </Marker>
            
            <MapEvents />
            <MapInstance />
          </MapContainer>
        </div>
        
        {/* Botones de acción del mapa */}
        <div className="flex gap-2 mt-3">
          {allowCurrentLocation && (
            <button
              type="button"
              onClick={handleGetCurrentLocation}
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
            >
              {isLoading ? (
                <>
                  <svg className="w-4 h-4 mr-2 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Obteniendo ubicación...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Obtener mi ubicación
                </>
              )}
            </button>
          )}
        </div>
      </div>
    );
  };

  // Información de coordenadas actuales
  const renderCoordinatesInfo = () => {
    return (
      <div className="mt-3 p-3 bg-blue-50 rounded-lg">
        <div className="text-sm text-blue-800">
          <div className="font-medium mb-2">Coordenadas Actuales:</div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="text-xs text-blue-600">Latitud:</span>
              <div className="font-mono text-sm">{coordinates.lat.toFixed(6)}</div>
            </div>
            <div>
              <span className="text-xs text-blue-600">Longitud:</span>
              <div className="font-mono text-sm">{coordinates.lng.toFixed(6)}</div>
            </div>
          </div>
        </div>
        
        {/* Validación visual */}
        <div className="mt-2 flex items-center text-xs">
          <div className={`
            w-2 h-2 rounded-full mr-2
            ${error ? 'bg-red-500' : 'bg-green-500'}
          `} />
          <span className={error ? 'text-red-600' : 'text-green-600'}>
            {error ? 'Coordenadas inválidas' : 'Coordenadas válidas'}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Input de coordenadas */}
      <div>
        <BaseInput
          {...baseInputProps}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          placeholder={baseInputProps.placeholder || 'Ej: 19.4326, -99.1332'}
          error={error || baseInputProps.error}
          touched={baseInputProps.touched || !!error}
        />
        
        {/* Mensaje de ayuda */}
        <div className="mt-1 text-xs text-gray-500">
          Formato: latitud, longitud (ej: 19.4326, -99.1332)
        </div>
      </div>

      {/* Error de validación */}
      {showValidationErrors && error && (
        <div className="flex items-center text-sm text-red-600">
          <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 001-1v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          {error}
        </div>
      )}

      {/* Mapa interactivo */}
      {renderMap()}

      {/* Info de coordenadas */}
      {renderCoordinatesInfo()}

      {/* Indicadores de rango válido */}
      <div className="text-xs text-gray-500">
        <div>Latitud: {COORDINATE_RANGES.latitude.min}° a {COORDINATE_RANGES.latitude.max}°</div>
        <div>Longitud: {COORDINATE_RANGES.longitude.min}° a {COORDINATE_RANGES.longitude.max}°</div>
      </div>
    </div>
  );
};

export default LocationInput;
