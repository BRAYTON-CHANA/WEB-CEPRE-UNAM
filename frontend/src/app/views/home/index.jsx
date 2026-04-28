import React, { useState, useEffect } from 'react';
import Layout from '@/shared/components/layout/Layout';
import logo from '@/../../public/logo.jpg';

function Home() {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const targetDate = new Date('2026-05-16T00:00:00');
    
    const calculateTimeLeft = () => {
      const now = new Date();
      const difference = targetDate - now;
      
      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);
        setTimeLeft({ days, hours, minutes, seconds });
      }
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);
    
    return () => clearInterval(interval);
  }, []);

  const groupsData = [
    { grupo: 'G1 ING', curso: 'Matemáticas I', hora: '07:10', aula: 'Aula 1', docente: 'Docente I' },
    { grupo: 'G2 ING', curso: 'Matematicas II', hora: '07:10', aula: 'Aula 2', docente: 'Docente II' },
    { grupo: 'G3 ING', curso: 'Razonamiento Verbal', hora: '07:10', aula: 'Aula 3', docente: 'Docente III' },
    { grupo: 'G4 ING', curso: 'Razonamiento Matematico', hora: '07:10', aula: 'Aula 4', docente: 'Docente IV' },
    { grupo: 'G5 ING', curso: 'Biologia', hora: '07:10', aula: 'Aula 5', docente: 'Docente V' },
  ];

  return (
    <Layout>
      <div className="min-h-screen py-12">
        <div className="text-center max-w-4xl mx-auto px-4 mb-12">
          <div className="mb-8 animate-fadeIn">
            <img 
              src={logo} 
              alt="Logo" 
              className="w-32 h-32 mx-auto object-contain"
            />
          </div>
          <h1 className="text-5xl font-bold text-gradient mb-6 animate-fadeIn">
            Sistema de Gestión de Horarios
          </h1>
          <p className="text-xl text-gray-600 mb-8 animate-fadeIn">
            Aplicación para la creación y gestión de horarios académicos
          </p>
        </div>

        <div className="max-w-6xl mx-auto px-4">
          <div className="card animate-fadeIn">
            <div className="card-header">
              <h2 className="text-2xl font-bold text-gray-800">Horarios de Grupos</h2>
              <p className="text-gray-600 mt-1">El 16 de mayo es el curso más próximo</p>
            </div>
            <div className="card-body">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Grupo</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Curso</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hora</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aula</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Docente</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cuenta Regresiva</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {groupsData.map((group, index) => (
                      <tr key={index} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{group.grupo}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{group.curso}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{group.hora}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{group.aula}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{group.docente}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-[#2D366F]">
                          {timeLeft.days}d {timeLeft.hours}h {timeLeft.minutes}m {timeLeft.seconds}s
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default Home;
