import React from 'react';
import SelectInput from './SelectInput';
import { COUNTRIES, POPULAR_COUNTRIES, getCountryByCode } from '@/shared/constants/countries';

/**
 * Componente CountryInput especializado
 * Usa SelectInput con opciones de países del mundo
 */
const CountryInput = ({ 
  // Props específicas de país
  showFlags = true,
  showPhoneCode = true,
  popularOnly = false,
  groupByContinent = false,
  priorityCountries = [],
  excludeCountries = [],
  
  // Props de visualización
  displayFormat = 'name', // 'name', 'flag-name', 'name-code', 'full'
  
  // Pasar todas las demás props al SelectInput
  ...selectInputProps 
}) => {
  // Generar opciones de países
  const generateCountryOptions = () => {
    let countries = popularOnly 
      ? COUNTRIES.filter(c => POPULAR_COUNTRIES.includes(c.code))
      : [...COUNTRIES];
    
    // Excluir países si se especifican
    if (excludeCountries.length > 0) {
      countries = countries.filter(c => !excludeCountries.includes(c.code));
    }
    
    // Priorizar ciertos países al inicio
    if (priorityCountries.length > 0) {
      const priority = countries.filter(c => priorityCountries.includes(c.code));
      const others = countries.filter(c => !priorityCountries.includes(c.code));
      countries = [...priority, ...others];
    }
    
    // Transformar a formato de opciones
    return countries.map(country => {
      let label = country.name;
      let description = '';
      
      // Formato del label según configuración
      if (displayFormat === 'flag-name' && showFlags) {
        label = `${country.flag} ${country.name}`;
      } else if (displayFormat === 'name-code') {
        label = `${country.name} (${country.code})`;
      } else if (displayFormat === 'full') {
        label = showFlags ? `${country.flag} ${country.name}` : country.name;
        description = showPhoneCode ? `${country.phoneCode} • ${country.continent}` : country.continent;
      }
      
      return {
        value: country.code,
        label: label,
        description: description,
        icon: showFlags ? country.flag : null,
        phoneCode: country.phoneCode,
        continent: country.continent,
        name: country.name
      };
    });
  };
  
  // Generar opciones agrupadas por continente
  const generateGroupedOptions = () => {
    const continents = {};
    
    COUNTRIES.forEach(country => {
      if (!continents[country.continent]) {
        continents[country.continent] = [];
      }
      
      let label = country.name;
      if (displayFormat === 'flag-name' && showFlags) {
        label = `${country.flag} ${country.name}`;
      }
      
      continents[country.continent].push({
        value: country.code,
        label: label,
        description: showPhoneCode ? country.phoneCode : '',
        icon: showFlags ? country.flag : null,
        phoneCode: country.phoneCode,
        continent: country.continent,
        name: country.name
      });
    });
    
    // Convertir a array de grupos
    return Object.entries(continents).map(([continent, countries]) => ({
      label: continent,
      options: countries
    }));
  };
  
  // Obtener país seleccionado
  const getSelectedCountry = () => {
    const value = selectInputProps.value;
    if (!value) return null;
    return getCountryByCode(value);
  };
  
  // Preparar opciones
  const options = groupByContinent ? generateGroupedOptions() : generateCountryOptions();
  
  // Renderizar info del país seleccionado
  const renderSelectedCountryInfo = () => {
    const country = getSelectedCountry();
    if (!country) return null;
    
    return (
      <div className="mt-3 p-3 bg-blue-50 rounded-lg">
        <div className="flex items-center">
          <span className="text-2xl mr-3">{country.flag}</span>
          <div>
            <div className="font-semibold text-gray-900">{country.name}</div>
            <div className="text-sm text-gray-600">
              {country.continent} • {country.phoneCode}
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  return (
    <div className="space-y-2">
      <SelectInput
        {...selectInputProps}
        options={options}
        placeholder={selectInputProps.placeholder || 'Selecciona un país'}
        searchable={true}
        optionLabel="label"
        optionValue="value"
        optionDescription="description"
        optionIcon="icon"
      />
      
      {/* Información del país seleccionado */}
      {!groupByContinent && renderSelectedCountryInfo()}
    </div>
  );
};

export default CountryInput;
