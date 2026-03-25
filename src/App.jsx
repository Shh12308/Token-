import React from 'react';
import { Routes, Route } from 'react-router-dom';

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<div style={{ color: 'white' }}>Home</div>} />
    </Routes>
  );
};

export default App;
