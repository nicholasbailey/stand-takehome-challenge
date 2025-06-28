import React from 'react';
import { InspectionForm, Card, Hero } from '@mitigation/shared-components';
import './App.css';

function App() {
  return (
    <div className="App">
      <Card>
        <Hero title="Stand Insurance Mitigation Tool" />
        <InspectionForm ruleSetId="main" />
      </Card>
    </div>
  );
}

export default App; 