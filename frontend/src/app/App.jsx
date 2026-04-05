import React from 'react';
import { Routes, Route } from 'react-router-dom';
import '@/shared/theme/globals.css';

// Import pages
import Home from '@/app/views/home';
import Modules from '@/app/views/modules';
import Test from '@/app/views/modules/tests';
import TestTable from '@/app/views/modules/test-table';
import FormTest from '@/app/views/modules/form-test';
import CrudPage from '@/app/views/modules/crud';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/modules" element={<Modules />} />
      <Route path="/modules/tests" element={<Test />} />
      <Route path="/modules/test-table" element={<TestTable />} />
      <Route path="/modules/form-test" element={<FormTest />} />
      <Route path="/modules/crud" element={<CrudPage />} />
    </Routes>
  );
}

export default App;
