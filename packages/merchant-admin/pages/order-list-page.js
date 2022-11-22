import React from 'react';
import { useQuery, gql } from '@apollo/client';
import List from '../components/list';
import { formateDateTime, formatEther, trimAddress } from '../common/utils';
import ErrorView from '../components/error-view';

const findOrdersQuery = gql`
  query findOrders {
    orders: findOrders {
      id
      buyerAddress
      quantity
      amount
      status
      createdAt
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
            buyerAddress: 'Buyer',
            quantity: 'Quantity',
            amount: 'Total Amount',
            status: 'Status',
            createdAt: 'Placed on',
          }}
          formatters={{ buyerAddress: trimAddress, amount: formatEther, createdAt: formateDateTime }}
          redirectTo={(order) => `/orders/${order.id}`}
        />
      )}

    </div>
  );
}

export default OrdersListPage;
