import React from 'react';
import DateInput from '@/shared/components/ui/inputs/DateInput';

const FechaInputs = ({ fechaInicio, setFechaInicio, fechaFin, setFechaFin }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <DateInput
        name="fecha_inicio"
        label="Fecha inicio"
        value={fechaInicio}
        onChange={(_, val) => setFechaInicio(val)}
        required
      />
      <DateInput
        name="fecha_fin"
        label="Fecha fin"
        value={fechaFin}
        onChange={(_, val) => setFechaFin(val)}
        required
      />
    </div>
  );
};

export default FechaInputs;
