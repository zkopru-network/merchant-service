import React from 'react';
import { useQuery, gql } from '@apollo/client';
import List from '../components/list';
import { formateDateTime, formatEther, trimAddress } from '../common/utils';
import ErrorView from '../components/error-view';
import { fromWei } from 'web3-utils';

const findOrdersQuery = gql`
  query findOrders {
    orders: findOrders {
      id
      quantity
      amount
      status
      createdAt
      product {
        name
      }
    }
  }
`;

function OrdersListPage() {
  const { loading, error, data } = useQuery(findOrdersQuery);

  return (
    <div className="page order-list-page">

      <div className="page-title">
        Orders
      </div>

      {error && (
        <ErrorView error={error} />
      )}

      {!error && (
        <List
          itemName="order"
          loading={loading}
          items={data?.orders}
          fields={{
            product: 'Product',
            quantity: 'Quantity',
            amount: 'Total Amount',
            status: 'Status',
            createdAt: 'Placed on',
          }}
          formatters={{
            product: p => p.name,
            amount: v => formatEther(fromWei(v)),
            createdAt: formateDateTime,
            quantity: v => fromWei(v)
          }}
          redirectTo={(order) => `/orders/${order.id}`}
        />
      )}

    </div>
  );
}

export default OrdersListPage;
