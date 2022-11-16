import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery, gql } from '@apollo/client';
import List from '../components/list';
import { formatEther } from '../common/utils';
import ErrorView from '../components/error-view';

const findProductsQuery = gql`
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

function ProductsListPage() {
  const { loading, error, data } = useQuery(findProductsQuery);

  return (
    <div className="page product-list-page">

      <div className="page-title">
        Products
        <Link className="button" to="/products/new">Add Product</Link>
      </div>

      {error && (
        <ErrorView error={error} />
      )}

      {!error && (
        <List
          itemName="product"
          loading={loading}
          items={data?.products}
          fields={{
            name: 'Name',
            tokenStandard: 'Token Standard',
            tokenId: 'Token ID',
            availableQuantity: 'Quantity',
            price: 'Price',
          }}
          formatters={{ price: formatEther }}
          redirectTo={(product) => `/products/${product.id}`}
        />
      )}

    </div>
  );
}

export default ProductsListPage;
