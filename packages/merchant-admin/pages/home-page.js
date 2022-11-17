import React from 'react';
import { useQuery, gql } from '@apollo/client';
import MetricBox from '../components/metric-box';
import Chart from '../components/chart';

const getStoreMetricsQuery = gql`
  query getStoreMetrics {
    metrics: getStoreMetrics {
      totalProducts
      totalOrders
      totalOrderAmount
      orderHistory {
        timestamp
        totalOrders
        totalOrderAmount
      }
    }
  }
`;

function HomePage() {
  const { loading, data } = useQuery(getStoreMetricsQuery);
  const { metrics = {} } = data || {};

  return (
    <div className="page home-page">

      <div className="page-title">
        Dashboard
      </div>

      <div className="flex-row">
        <MetricBox
          label="Products"
          loading={loading}
          value={metrics.totalProducts}
        />
        <MetricBox
          label="Orders"
          loading={loading}
          value={metrics.totalOrders}
        />
        <MetricBox
          label="Total Sale Amount"
          loading={loading}
          value={metrics.totalOrderAmount}
          unit="Ξ "
        />
      </div>

      <div className="mt-5">
        <div className="subtitle">Order Trend</div>

        <div style={{ height: '350px' }}>
          <Chart
            loading={loading}
            data={[...metrics.orderHistory || []].reverse()}
            xAxisKey="timestamp"
            yAxisKeys={['totalOrders', 'totalOrderAmount']}
            xAxisFormatter={(a) => new Date(a)}
          />
        </div>
      </div>

    </div>
  );
}

export default HomePage;
