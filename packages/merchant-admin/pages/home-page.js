import React from 'react';
import MetricBox from '../components/metric-box';

function HomePage() {
  return (
    <div className="page home-page">

      <div className="metrics">

        <MetricBox
          label="Products"
          value="10"
        />

      </div>

    </div>
  );
}

export default HomePage;
