// Sentinel para la "sede" virtual: grupos/plazas con ID_SEDE NULL.
// Se usa en las tabs de sede del módulo /asistencias; los hooks que
// filtran por sede server-side deben omitir ID_SEDE y filtrar null
// del lado del cliente cuando el valor es SEDE_VIRTUAL.
export const SEDE_VIRTUAL = 'VIRTUAL';

// Normaliza el ID_SEDE de una fila: null/undefined → SEDE_VIRTUAL.
export const sedeKey = (idSede) => idSede ?? SEDE_VIRTUAL;
