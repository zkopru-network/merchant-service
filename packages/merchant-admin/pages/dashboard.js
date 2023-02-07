import React from 'react';
import { useQuery, gql } from '@apollo/client';
import format from 'date-fns/format';
import isValid from 'date-fns/isValid';
import DatePicker from 'react-datepicker';
import startOfDay from 'date-fns/startOfDay';
import addDays from 'date-fns/addDays';
import endOfDay from 'date-fns/endOfDay';
import { fromWei } from 'web3-utils';
import MetricBox from '../components/metric-box';
import Chart from '../components/chart';
import TopItems from '../components/top-items';
import { formatEther, trimAddress } from '../common/utils';
import { BN } from 'bn.js';

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
  const [startDate, setStartDate] = React.useState(startOfDay(addDays(new Date(), 7 * -1)));
  const [endDate, setEndDate] = React.useState(endOfDay(new Date(), 0));
  const [dateRange, setDateRange] = React.useState([startDate, endDate]);

  console.log(startDate, endDate)

  React.useEffect(() => {
    const [start, end] = dateRange;
    if (start && end) {
      setStartDate(start);
      setEndDate(end);
    }
  }, [dateRange]);

  const { loading, data, refetch } = useQuery(getStoreMetricsQuery, {
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
    topProductsByAmount = [],
    topProductsByQuantity = [],
  } = metrics;

  const avgOrderAmount = (totalOrders && totalOrderAmount) ? 
    Number(fromWei(new BN(totalOrderAmount).div(new BN(totalOrders)))).toFixed(2)
    : '0';

  return (
    <div className="page home-page">

      <div className="page-title">
        Dashboard

        <div className="date-picker">
          <DatePicker
            selectsRange
            onChange={g => {
              const [start, end] = g;
              setDateRange([start && startOfDay(start), end && endOfDay(end)])
            }}
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
          value={totalInventoryValue ? Math.round(Number(fromWei(totalInventoryValue)).toFixed(2)) : '-'}
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
          value={totalOrderAmount ? fromWei(totalOrderAmount) : '-'}
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
        data={dailyOrderSnapshots.map(a => ({ ...a, totalOrderAmount: fromWei( a.totalOrderAmount)}))}
        xAxisKey="timestamp"
        yAxisKeys={['totalOrders', 'totalOrderAmount']}
        yAxisLabels={['Total orders', 'Total sales (Ξ)']}
        xAxisFormatter={(a) => (isValid(new Date(a)) ? format(new Date(a), 'MMM dd') : a)}
      />

      <div className="mt-4 columns">

        <div className="column is-6">
          <TopItems
            title="Top Products by Sales Amount"
            loading={loading}
            items={topProductsByAmount}
            itemName="product"
            nameKey="productName"
            valueKey="totalOrderAmount"
            valueLabel="Amount"
            valueFormatter={(v) => formatEther(fromWei(v.toString()))}
          />
        </div>

        <div className="column is-6">
          <TopItems
            title="Top Products by Quantity Sold"
            loading={loading}
            items={topProductsByQuantity}
            itemName="product"
            nameKey="productName"
            valueKey="totalSold"
            valueLabel="Total Sold"
          />
        </div>

      </div>

    </div>
  );
}

export default Dashboard;
