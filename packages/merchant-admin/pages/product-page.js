import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery, gql } from '@apollo/client';
import { trimAddress } from '../common/utils';

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
  const isNFT = product?.tokenStandard === 'Erc721';

  if (error) {
    return JSON.stringify(error, null, 2);
  }

  if (loading) {
    return (
      <div className="page products-page">
        Loading
      </div>
    );
  }

  return (
    <div className="page product-page">

      <div className="page-title">
        Product - {product.name}
      </div>

      <div className="section mb-5">
        <div className="section__title">
          {product.name}
        </div>
        <div className="section__description">
          {product.description}
        </div>

        <div className="product-page__container">

          <div className="product-page__image">
            <img src={product.imageUrl} alt={product.name} />
          </div>

          <div className="product-page__details">
            <div className="product-page__label">Contract</div>
            <div className="product-page__value">{product.tokenStandard?.toUpperCase()} - {product.contractAddress}</div>
            {product.tokenId && (
              <>
                <div className="product-page__label">Token Id</div>
                <div className="product-page__value">{product.tokenId}</div>
              </>
            )}
            <div className="product-page__label">Price</div>
            <div className="product-page__value">Ξ {product.price}</div>

            {!isNFT && (
              <>
                <div className="product-page__label">Available Quantity</div>
                <div className="product-page__value">{product.availableQuantity}</div>
                <div className="product-page__label">Total Sold</div>
                <div className="product-page__value">{totalSold}</div>
              </>
            )}
          </div>

        </div>
      </div>

      {hasSold && (
        <>
          <hr />
          <div className="list">
            <div className="title">Orders</div>

            <div className="columns list__header">
              <div className="column list__title">Buyer</div>
              <div className="column list__title">Quantity</div>
              <div className="column list__title">Total Amount</div>
              <div className="column list__title">Status</div>
            </div>

            {loading && (
            <>
              <div className="list-item list-item--loading" />
              <div className="list-item list-item--loading" />
              <div className="list-item list-item--loading" />
            </>
            )}

            {!loading && data?.matchingOrders?.map((order) => (
              <Link to={`/order/${order.id}`} key={order.id} className="list-item list-item--clickable">
                <div className="columns">
                  <div className="column list-item__value">{trimAddress(order.buyerAddress)}</div>
                  <div className="column list-item__value">{order.quantity}</div>
                  <div className="column list-item__value">{order.amount}</div>
                  <div className="column list-item__value">{order.status}</div>
                </div>
              </Link>
            ))}
          </div>
        </>
      )}

    </div>
  );
}

export default ProductPage;
