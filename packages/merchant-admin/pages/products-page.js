import React from 'react';
import { findProducts } from '../data';
import usePromise from '../hooks/use-promise';

function ProductsPage() {
  const [products, { isFetching, error }] = usePromise(() => findProducts());

  if (isFetching) {
    return (
      <div className="page products-page">

        <div className="product-item loading" />
        <div className="product-item loading" />
        <div className="product-item loading" />

      </div>
    );
  }

  return (
    <div className="page products-page">

      <div className="page-title">Products</div>

      <div className="list">
        <div className="columns list__header">
          <div className="column list__title">Name</div>
          <div className="column list__title">Token Standard</div>
          <div className="column list__title">Token ID</div>
          <div className="column list__title">Quantity</div>
          <div className="column list__title">Price</div>
        </div>

        {products.map((product) => (
          <div key={product.id} className="list-item list-item--clickable">
            <div className="columns">
              <div className="column list-item__value">{product.name}</div>
              <div className="column list-item__value">{product.tokenStandard}</div>
              <div className="column list-item__value">{product.tokenId}</div>
              <div className="column list-item__value">{product.availableQuantity}</div>
              <div className="column list-item__value">Ξ {product.price}</div>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}

export default ProductsPage;
