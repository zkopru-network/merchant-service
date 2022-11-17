import React from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, gql } from '@apollo/client';
import { formatEther, trimAddress } from '../common/utils';
import List from '../components/list';
import ErrorView from '../components/error-view';
import ProductView from '../components/product-view';

const getProductQuery = gql`
  query getProduct($id: String!) {
    product: getProduct(id: $id) {
      name
      description
      price
      availableQuantity
      contractAddress
      tokenStandard
      tokenId
      imageUrl
    }
    matchingOrders: findOrders(productId: $id) {
      id
      quantity
      buyerAddress
      amount
      status
    }
  }
`;

function ProductPage() {
  const { id } = useParams();
  const { loading, error, data = {} } = useQuery(getProductQuery, {
    variables: { id },
  });
  const { product, matchingOrders } = data;
  const hasSold = matchingOrders?.length > 0;
  const totalSold = hasSold ? matchingOrders.reduce((acc, o) => acc + o.amount, 0) : 0;

  if (error) {
    return <ErrorView error={error} />;
  }

  return (
    <div className="page product-page">

      <div className="page-title">
        Product - {product?.name}
      </div>

      <ProductView product={product} loading={loading} totalSold={totalSold} />

      <hr />

      <div className="title">Orders</div>
      <List
        itemName="matching order"
        loading={loading}
        items={data?.matchingOrders}
        fields={{
          buyerAddress: 'Buyer',
          quantity: 'Quantity',
          amount: 'Total Amount',
          status: 'Status',
        }}
        formatters={{ buyerAddress: trimAddress, amount: formatEther }}
        redirectTo={(order) => `/orders/${order.id}`}
      />

    </div>
  );
}

export default ProductPage;
