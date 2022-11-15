import React from 'react';
import MetricBox from '../components/metric-box';
import { findOrders } from '../data';
import usePromise from '../hooks/use-promise';

function HomePage() {
  const [orders, { isFetching, error }] = usePromise(() => findOrders());

  return (
    <div className="page home-page">

      <div className="metrics">

        <MetricBox
          label="Orders"
          value={orders?.length}
        />

      </div>

    </div>
  );
}

export default HomePage;
