import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery, gql } from '@apollo/client';

const findOrdersQuery = gql`
  query findProducts {
    products: findProducts {
      id
      name
      price
      availableQuantity
      tokenStandard
      tokenId
    }
  }
`;

function ProductsPage() {
  const { loading, error, data } = useQuery(findOrdersQuery);

  return (
    <div className="page products-page">

      <div className="page-title">
        Products

        <Link className="button" to="/products/new">Add Product</Link>
      </div>

      <div className="list">
        <div className="columns list__header">
          <div className="column list__title">Name</div>
          <div className="column list__title">Token Standard</div>
          <div className="column list__title">Token ID</div>
          <div className="column list__title">Quantity</div>
          <div className="column list__title">Price</div>
        </div>

        {loading && (
          <>
            <div className="list-item list-item--loading" />
            <div className="list-item list-item--loading" />
            <div className="list-item list-item--loading" />
          </>
        )}

        {!loading && data?.products?.map((product) => (
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
