import React from 'react';
import SidebarMenu from '@/shared/components/layout/SidebarMenu';
import logo from '@/shared/assets/images/unam-logo.png';

const CepreSidebar = () => {
  return (
    <SidebarMenu
      items={[]}
      className="!w-[260px] h-full shadow-[4px_0_24px_-12px_rgba(0,0,0,0.05)]"
      header={
        <div className="flex items-center gap-3">
          <img src={logo} alt="UNAM" className="h-10 w-auto object-contain" />
          <div className="flex flex-col">
            <span className="text-base font-bold text-[#2D366F] leading-tight">CEPRE</span>
            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider leading-tight">
              Universidad Nacional de Moquegua
            </span>
          </div>
        </div>
      }
      footer={
        <p className="text-xs text-slate-400 text-center">
          Módulos próximamente
        </p>
      }
    />
  );
};

export default CepreSidebar;
