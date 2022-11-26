import React from 'react';
import { useQuery, gql } from '@apollo/client';
import { Link } from 'react-router-dom';
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
        Featured Items
      </div>

      <div className="product-cards">
        {products.map((product) => (
          <Link key={product.id} to={`/products/${product.id}`}>
            <ProductCard product={product} loading={loading} />
          </Link>
        ))}
      </div>

    </div>
  );
}

export default Dashboard;
