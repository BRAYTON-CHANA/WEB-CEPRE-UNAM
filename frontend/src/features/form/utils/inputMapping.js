import TextInput from '@/shared/components/ui/inputs/TextInput';
import EmailInput from '@/shared/components/ui/inputs/EmailInput';
import PasswordInput from '@/shared/components/ui/inputs/PasswordInput';
import IntegerInput from '@/shared/components/ui/inputs/IntegerInput';
import FloatInput from '@/shared/components/ui/inputs/FloatInput';
import DateInput from '@/shared/components/ui/inputs/DateInput';
import TimeInput from '@/shared/components/ui/inputs/TimeInput';
import DateTimeInput from '@/shared/components/ui/inputs/DateTimeInput';
import SelectInput from '@/shared/components/ui/inputs/SelectInput';
import UniqueSelectInput from '@/shared/components/ui/inputs/UniqueSelectInput';
import ReferenceSelectInput from '@/shared/components/ui/inputs/ReferenceSelectInput';
import FunctionSelectInput from '@/shared/components/ui/inputs/FunctionSelectInput';
import CascadeSearchInput from '@/shared/components/ui/inputs/CascadeSearchInput';
import TextAreaInput from '@/shared/components/ui/inputs/TextAreaInput';
import FileInput from '@/shared/components/ui/inputs/FileInput';
import CheckboxInput from '@/shared/components/ui/inputs/CheckboxInput';
import BooleanInput from '@/shared/components/ui/inputs/BooleanInput';
import RadioInput from '@/shared/components/ui/inputs/RadioInput';
import PhoneInput from '@/shared/components/ui/inputs/PhoneInput';
import CountryInput from '@/shared/components/ui/inputs/CountryInput';
import ColorInput from '@/shared/components/ui/inputs/ColorInput';
import LocationInput from '@/shared/components/ui/inputs/LocationInput';

/**
 * Mapeo de tipos de campo a componentes de input
 * Facilita agregar nuevos tipos: solo añadir aquí
 */
export const INPUT_COMPONENTS = {
  // Inputs de texto básicos
  text: TextInput,
  email: EmailInput,
  password: PasswordInput,
  textarea: TextAreaInput,

  // Inputs numéricos
  integer: IntegerInput,
  number: IntegerInput,  // Alias para integer
  float: FloatInput,
  decimal: FloatInput,  // Alias para float

  // Inputs de fecha/tiempo
  date: DateInput,
  time: TimeInput,
  datetime: DateTimeInput,

  // Inputs de selección
  select: SelectInput,
  dropdown: SelectInput,  // Alias para select
  'unique-select': UniqueSelectInput,  // Valores únicos de columna
  'reference-select': ReferenceSelectInput,  // Referencias FK con display legible
  'function-select': FunctionSelectInput,  // Funciones SQL parametrizadas
  'cascade-search': CascadeSearchInput,  // Búsqueda en cascada con múltiples selects

  // Inputs de archivo
  file: FileInput,

  // Inputs booleanos
  checkbox: CheckboxInput,
  boolean: BooleanInput,
  radio: RadioInput,

  // Inputs especializados
  phone: PhoneInput,
  country: CountryInput,
  color: ColorInput,
  location: LocationInput
};

/**
 * Obtiene el componente de input correspondiente al tipo
 * @param {string} type - Tipo de campo
 * @returns {Component} - Componente de React
 */
export const getInputComponent = (type) => {
  return INPUT_COMPONENTS[type] || TextInput;
};

/**
 * Verifica si un tipo de input existe
 * @param {string} type - Tipo de campo
 * @returns {boolean} - true si existe
 */
export const isValidInputType = (type) => {
  return type in INPUT_COMPONENTS;
};

/**
 * Obtiene los tipos de input soportados
 * @returns {Array} - Array de strings con los tipos
 */
export const getSupportedInputTypes = () => {
  return Object.keys(INPUT_COMPONENTS);
};

export default INPUT_COMPONENTS;
