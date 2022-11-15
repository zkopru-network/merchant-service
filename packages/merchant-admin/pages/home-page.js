import React from 'react';
import { useQuery, gql } from '@apollo/client';
import MetricBox from '../components/metric-box';

const findOrdersQuery = gql`
  query findOrders {
    orders: findOrders {
      id
      amount
      status
    }
  }
`;

function HomePage() {
  const { loading, error, data } = useQuery(findOrdersQuery);

  return (
    <div className="page home-page">

      <div className="metrics">

        <MetricBox
          label="Orders"
          loading={loading}
          value={data?.orders?.length}
        />

      </div>

    </div>
  );
}

export default HomePage;
