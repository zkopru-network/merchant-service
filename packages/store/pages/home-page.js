import React from 'react';
import { useQuery, gql } from '@apollo/client';
import ProductCard from '../components/product-card';

const findProductsQuery = gql`
  query findProducts {
    products: findProducts {
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
  }
`;

function Dashboard() {
  const { loading, data } = useQuery(findProductsQuery);

  const { products = [] } = data || {};

  return (
    <div className="page home-page">

      <div className="page-title">
        Dashboard
      </div>

      <div className="product-cards">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} loading={loading} />
        ))}
      </div>

    </div>
  );
}

export default Dashboard;
