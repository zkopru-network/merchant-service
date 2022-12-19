import React from 'react';
import { useQuery, gql } from '@apollo/client';
import { useParams } from 'react-router';
import { fromWei } from 'web3-utils';

const getOrderQuery = gql`
  query getOrder($id: String) {
    order: getOrder(id: $id) {
      quantity
      amount
      buyerTransactionHash
      sellerTransactionHash
      product {
        id
        name
        price
        tokenId
        imageUrl
      }
    }
  }
`;

function OrderPage() {
  const { id } = useParams();

  const { loading, data } = useQuery(getOrderQuery, {
    variables: {
      id,
    },
  });

  const { order = {} } = data || {};
  const { product } = order;

  return (
    <div className="page home-page">

      <div className="page-title">
        Order Successful
      </div>

      <div className="flex-row">

        {loading ? (
          <div className="section loading" />
        ) : (
          <div className={`section ${loading ? 'loading' : ''}`}>

            <div className="section__label">Product</div>
            <div className="section__value">{product.name}</div>

            {product.tokenId && (
              <>
                <div className="section__label">Product</div>
                <div className="section__value">{product.tokenId}</div>
              </>
            )}

            <div className="section__label">Quantity</div>
            <div className="section__value">{fromWei(order.quantity)}</div>

            <div className="section__label">Unit price</div>
            <div className="section__value">
              <span className="section__unit">Ξ</span> {fromWei(product.price)}
            </div>

            <div className="section__label">Total Amount</div>
            <div className="section__value">
              <span className="section__unit">Ξ</span> {fromWei(order.amount)}
            </div>

            <div className="section__label">Transaction Hash</div>
            <div className="section__value">{order.buyerTransactionHash}</div>

            <div className="section__label">Merchant Transaction Hash</div>
            <div className="section__value">{order.sellerTransactionHash}</div>

          </div>
        )}

        <div className={`product-image ${loading ? 'loading' : ''}`}>
          {product?.imageUrl && (
          <img src={product.imageUrl} alt={product.name} />
          )}
        </div>

      </div>

    </div>
  );
}

export default OrderPage;
