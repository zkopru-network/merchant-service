import React from 'react';
import { useQuery, gql } from '@apollo/client';
import List from '../components/list';
import { formatEther, trimAddress } from '../common/utils';
import ErrorView from '../components/error-view';

const findOrdersQuery = gql`
  query findOrders {
    orders: findOrders {
      id
      buyerAddress
      quantity
      amount
      status
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
          }}
          formatters={{ buyerAddress: trimAddress, amount: formatEther }}
          redirectTo={(order) => `/orders/${order.id}`}
        />
      )}

    </div>
  );
}

export default OrdersListPage;
