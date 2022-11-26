import React from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, gql, useMutation } from '@apollo/client';
import { formatEther, trimAddress } from '../common/utils';

const getProductQuery = gql`
  query getProduct($id: String!) {
    product: getProduct(id: $id) {
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

function ProductPage() {
  const { id } = useParams();

  const { loading, data = {} } = useQuery(getProductQuery, {
    variables: { id },
  });

  const { product } = data;

  return (
    <div className="page product-page">

      <div className="page-title">
        Product - {product?.name}
      </div>

      <hr />

    </div>
  );
}

export default ProductPage;
