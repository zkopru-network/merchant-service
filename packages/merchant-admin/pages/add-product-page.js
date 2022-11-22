import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, gql } from '@apollo/client';
import { TokenStandard } from '../common/constants';
import ProductForm from '../components/product-form';

const addProductQuery = gql`
  mutation addProduct($productInput: ProductInput!) {
    addProduct(product: $productInput) {
      id
      name
      price
      availableQuantity
      tokenStandard
      tokenId
    }
  }
`;

function AddProductPage() {
  const navigate = useNavigate();

  const [addProductMutation] = useMutation(addProductQuery);

  async function onSubmit(product) {
    try {
      await addProductMutation({ variables: { productInput: product } });
      navigate('/products');
    } catch (error) {
      // eslint-disable-next-line no-alert
      window.alert(`Error while creating product : ${error.message}`);
    }
  }

  return (
    <div className="page products-page">

      <div className="page-title">
        Add Product
      </div>

      <ProductForm onSubmit={(p) => onSubmit(p)} />

    </div>
  );
}

export default AddProductPage;
