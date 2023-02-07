import React from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, gql } from '@apollo/client';
import { trimAddress } from '../common/utils';
import ErrorView from '../components/error-view';
import ProductView from '../components/product-view';
import { fromWei } from 'web3-utils';

const getOrderQuery = gql`
  query getOrder($id: String!) {
    order: getOrder(id: $id) {
      id
      product {
        id
        name
        description
        price
        availableQuantity
        contractAddress
        tokenStandard
        tokenId
        imageUrl
      }
      quantity
      createdAt
      buyerTransactionHash
      sellerTransactionHash
      amount
      status
    }
  }
`;

function OrderPage() {
  const { id } = useParams();
  const { loading, error, data = {} } = useQuery(getOrderQuery, {
    variables: { id },
  });
  const { order = {} } = data;
  const { product } = order;

  if (error) {
    return <ErrorView error={error} />;
  }

  return (
    <div className="page order-page">

      <div className="page-title">
        {product && `Order for ${product.name}`}
      </div>

      <div className={`section mb-5 pl-1 ${loading ? 'section--loading' : ''}`}>
        <div className="product-view__details">
          {!loading && order && (
            <>
              <div className="product-view__label">Quantity</div>
              <div className="product-view__value">{fromWei(order.quantity)}</div>

              <div className="product-view__label">Total Amount</div>
              <div className="product-view__value">{fromWei(order.amount)}</div>

              <div className="product-view__label">Status</div>
              <div className="product-view__value">{order.status}</div>

              <div className="product-view__label">Date/Time</div>
              <div className="product-view__value">{new Date(order.createdAt).toLocaleString()}</div>

              <div className="product-view__label">Customer Transaction</div>
              <div className="product-view__value">{order.buyerTransactionHash}</div>

              <div className="product-view__label">Merchant Transaction</div>
              <div className="product-view__value">{order.sellerTransactionHash}</div>
            </>
          )}
        </div>
      </div>

      <hr />
      <div className="title">Product</div>

      <ProductView product={product} loading={loading} showLink />

    </div>
  );
}

export default OrderPage;
