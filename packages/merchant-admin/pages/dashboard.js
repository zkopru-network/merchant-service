import React from 'react';
import { useQuery, gql } from '@apollo/client';
import format from 'date-fns/format';
import isValid from 'date-fns/isValid';
import DatePicker from 'react-datepicker';
import startOfDay from 'date-fns/startOfDay';
import addDays from 'date-fns/addDays';
import endOfDay from 'date-fns/endOfDay';
import MetricBox from '../components/metric-box';
import Chart from '../components/chart';
import TopItems from '../components/top-items';
import { formatEther, trimAddress } from '../common/utils';

const getStoreMetricsQuery = gql`
  query getStoreMetrics($startDate: String, $endDate: String) {
    metrics: getStoreMetrics(startDate: $startDate, endDate: $endDate) {
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

function Dashboard() {
  const [startDate, setStartDate] = React.useState(startOfDay(addDays(new Date(), 30 * -1)));
  const [endDate, setEndDate] = React.useState(endOfDay(addDays(new Date(), -1)));
  const [dateRange, setDateRange] = React.useState([startDate, endDate]);

  React.useEffect(() => {
    const [start, end] = dateRange;
    if (start && end) {
      setStartDate(start);
      setEndDate(end);
    }
  }, [dateRange]);

  const { loading, data } = useQuery(getStoreMetricsQuery, {
    variables: {
      startDate: startDate?.toISOString(),
      endDate: endDate?.toISOString(),
    },
    skip: !startDate || !endDate,
  });

  const { metrics = {} } = data || {};

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

  const avgOrderAmount = totalOrderAmount ? (totalOrderAmount / totalOrders).toFixed(2) : '';

  return (
    <div className="page home-page">

      <div className="page-title">
        Dashboard

        <div className="date-picker">
          <DatePicker
            selectsRange
            onChange={setDateRange}
            startDate={dateRange[0]}
            endDate={dateRange[1]}
            dateFormat="MMM dd"
            maxDate={new Date()}
          />
        </div>
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
          label="Total Sales"
          loading={loading}
          value={totalOrderAmount}
          unit="Ξ"
        />
        <MetricBox
          label="Avg. Order Amount"
          loading={loading}
          value={avgOrderAmount}
          unit="Ξ"
        />
      </div>

      <Chart
        title="Daily Orders"
        className="mt-4"
        height={300}
        loading={loading}
        data={dailyOrderSnapshots}
        xAxisKey="timestamp"
        yAxisKeys={['totalOrders', 'totalOrderAmount']}
        xAxisFormatter={(a) => (isValid(new Date(a)) ? format(new Date(a), 'MMM dd') : a)}
      />

      <div className="mt-4 columns">

        <div className="column is-4">
          <TopItems
            title="Top Products by Amount"
            loading={loading}
            items={topProductsByAmount}
            itemName="product"
            nameKey="productName"
            valueKey="totalOrderAmount"
            valueFormatter={(v) => formatEther(v)}
            valueLabel="Amount"
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
            valueLabel="Total Sold"
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
            valueLabel="Total Amount"
          />
        </div>

      </div>

    </div>
  );
}

export default Dashboard;
