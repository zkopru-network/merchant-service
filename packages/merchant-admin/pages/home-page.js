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
      totalInventoryValue
      dailyOrderSnapshots {
        timestamp
        totalOrders
        totalOrderAmount
      }
      topBuyers {
        buyerAddress
        totalOrderAmount
      }
      topProducts {
        productName
        totalOrderAmount
      }
    }
  }
`;

function HomePage() {
  const { loading, data } = useQuery(getStoreMetricsQuery);
  const { metrics = {} } = data || {};

  // const startDate = startOfDay(addDays(new Date(), historyDays * -1));
  // const endDate = endOfDay(addDays(new Date(), -1));

  const {
    totalProducts,
    totalOrders,
    totalOrderAmount,
    totalInventoryValue,
    dailyOrderSnapshots = [],
    topBuyers = [],
    topProducts = [],
  } = metrics;

  return (
    <div className="page home-page">

      <div className="page-title">
        Dashboard
      </div>

      <div className="flex-row">
        <MetricBox
          label="Products"
          loading={loading}
          value={totalProducts}
        />
        <MetricBox
          label="Current Inventory Value"
          loading={loading}
          value={totalInventoryValue}
          unit="Ξ"
        />
        <MetricBox
          label="Orders"
          loading={loading}
          value={totalOrders}
        />
        <MetricBox
          label="Sale Amount"
          loading={loading}
          value={totalOrderAmount}
          unit="Ξ"
        />
      </div>

      <Chart
        title="Order Trend"
        className="mt-5"
        height={300}
        loading={loading}
        data={dailyOrderSnapshots}
        xAxisKey="timestamp"
        yAxisKeys={['totalOrders', 'totalOrderAmount']}
        xAxisFormatter={(a) => new Date(a).toDateString()}
      />

    </div>
  );
}

export default HomePage;
