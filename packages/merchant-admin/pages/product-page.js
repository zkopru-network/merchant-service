import React from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, gql, useMutation } from '@apollo/client';
import { formatEther, trimAddress } from '../common/utils';
import List from '../components/list';
import ErrorView from '../components/error-view';
import ProductView from '../components/product-view';
import ProductForm from '../components/product-form';
import Modal from '../components/modal';

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
    matchingOrders: findOrders(productId: $id) {
      id
      quantity
      buyerAddress
      amount
      status
    }
  }
`;

const editProductQuery = gql`
  mutation editProduct($id: String!, $productData: EditProductInput!) {
    editedProduct: editProduct(id: $id, productData: $productData) {
      id
    }
  }
`;

function ProductPage() {
  const { id } = useParams();

  const [showEditModal, setShowEditModal] = React.useState(false);

  const {
    loading, error, data = {}, refetch,
  } = useQuery(getProductQuery, {
    variables: { id },
  });
  const [addProductMutation] = useMutation(editProductQuery);

  const { product, matchingOrders } = data;
  const hasSold = matchingOrders?.length > 0;
  const totalSold = hasSold ? matchingOrders.reduce((acc, o) => acc + o.amount, 0) : 0;

  async function onEditProduct(updatedProduct) {
    try {
      await addProductMutation({
        variables: {
          id: updatedProduct.id,
          productData: {
            name: updatedProduct.name,
            description: updatedProduct.description,
            imageUrl: updatedProduct.imageUrl,
            availableQuantity: updatedProduct.availableQuantity,
            price: updatedProduct.price,
          },
        },
      });

      refetch();
      setShowEditModal(false);
    } catch (e) {
      // eslint-disable-next-line no-alert
      window.alert(`Error while editing product : ${e.message}`);
    }
  }

  if (error) {
    return <ErrorView error={error} />;
  }

  return (
    <div className="page product-page">

      <div className="page-title">
        Product - {product?.name}

        <button
          type="button"
          className="button"
          onClick={() => setShowEditModal(true)}
        >
          Edit
        </button>
      </div>

      <ProductView product={product} loading={loading} totalSold={totalSold} />

      <hr />

      <div className="title">Orders</div>
      <List
        itemName="matching order"
        loading={loading}
        items={data?.matchingOrders}
        fields={{
          buyerAddress: 'Buyer',
          quantity: 'Quantity',
          amount: 'Total Amount',
          status: 'Status',
        }}
        formatters={{ buyerAddress: trimAddress, amount: formatEther }}
        redirectTo={(order) => `/orders/${order.id}`}
      />

      <Modal
        title="Edit Product"
        isOpen={showEditModal}
        onRequestClose={() => setShowEditModal(false)}
        width="800px"
        height="820px"
      >
        <ProductForm
          isEditMode
          product={product}
          onSubmit={(p) => onEditProduct(p)}
        />
      </Modal>

    </div>
  );
}

export default ProductPage;
