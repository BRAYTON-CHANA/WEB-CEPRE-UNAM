import React, { useState } from 'react';
import { ConfigLayout } from '@/features/layout';
import TurnosPanel from '@/features/turnos/turnos/components/TurnosPanel';
import FechasBloqueadasPanel from '@/features/turnos/fechasBloqueadas/components/FechasBloqueadasPanel';

const TABS = [
  { id: 'turnos', label: 'Turnos' },
  { id: 'fechas', label: 'Fechas Bloqueadas' }
];

export default function TurnosConfig() {
  const [tab, setTab] = useState('turnos');

  return (
    <ConfigLayout>
      <div className="px-8 pt-6">
        <div className="inline-flex bg-gray-100 rounded-lg p-1 gap-1">
          {TABS.map(t => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all duration-150 ${
                tab === t.id
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {tab === 'turnos' ? <TurnosPanel /> : <FechasBloqueadasPanel />}
    </ConfigLayout>
  );
}
