import React from 'react';
import { useQuery, gql } from '@apollo/client';
import format from 'date-fns/format';
import MetricBox from '../components/metric-box';
import Chart from '../components/chart';
import TopItems from '../components/top-items';
import { formatEther, trimAddress } from '../common/utils';

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
      topProductsByAmount {
        productName
        totalOrderAmount
      }
      topProductsByQuantity {
        productName
        totalSold
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
    topProductsByAmount = [],
    topProductsByQuantity = [],
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
        title="Daily Orders"
        className="mt-5 mb-5"
        height={300}
        loading={loading}
        data={dailyOrderSnapshots}
        xAxisKey="timestamp"
        yAxisKeys={['totalOrders', 'totalOrderAmount']}
        xAxisFormatter={(a) => (a instanceof Date ? format(a, 'MMM dd') : a)}
      />

      <div className="mt-5 mb-5 columns">

        <div className="column is-4">
          <TopItems
            title="Top Products by Amount"
            loading={loading}
            items={topProductsByAmount}
            itemName="product"
            nameKey="productName"
            valueKey="totalOrderAmount"
            valueFormatter={(v) => formatEther(v)}
          />
        </div>

        <div className="column is-4">
          <TopItems
            title="Top Products by Quantity"
            loading={loading}
            items={topProductsByQuantity}
            itemName="product"
            nameKey="productName"
            valueKey="totalSold"
            valueFormatter={(v) => formatEther(v)}
          />
        </div>

        <div className="column is-4">
          <TopItems
            title="Top Buyers"
            loading={loading}
            items={topBuyers}
            itemName="buyer"
            nameKey="buyerAddress"
            valueKey="totalOrderAmount"
            nameFormatter={trimAddress}
            valueFormatter={(v) => formatEther(v)}
          />
        </div>

      </div>

    </div>
  );
}

export default HomePage;
