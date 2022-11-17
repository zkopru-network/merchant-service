import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, gql } from '@apollo/client';

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

  const [product, setProduct] = React.useState({});

  const [addProductMutation] = useMutation(addProductQuery);

  const isNFT = product.tokenStandard === 'Erc721';

  async function onSubmit(e) {
    e.preventDefault();
    e.stopPropagation();

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

      <form className="form" onSubmit={onSubmit} style={{ maxWidth: '800px' }}>

        <div className="form__title">
          Add new product
        </div>

        <div className="form__description">
          Add asset you own for sale - it could be either a ERC20 or ERC721 token. Products you add are immediately made available for purchase.
        </div>

        <div className="form__field">
          <label htmlFor="productName" className="label">Name
            <input
              id="productName"
              required
              type="text"
              className="form__input"
              value={product.name || ''}
              placeholder="Product name"
              onChange={(e) => { setProduct((p) => ({ ...p, name: e.target.value })); }}
            />
          </label>
        </div>

        <div className="form__field">
          <label htmlFor="description" className="label">
            Description
            <input
              id="description"
              type="text"
              className="form__input"
              value={product.description || ''}
              placeholder="A small description on what the product is"
              onChange={(e) => { setProduct((p) => ({ ...p, description: e.target.value })); }}
            />
          </label>
        </div>

        <div className="form__field">
          <label htmlFor="contractAddress" className="label">Contract Address
            <input
              id="contractAddress"
              type="text"
              required
              className="form__input"
              value={product.contractAddress || ''}
              placeholder="Contract address of the token"
              onChange={(e) => { setProduct((p) => ({ ...p, contractAddress: e.target.value })); }}
            />
          </label>
        </div>

        <div className="form__field">
          <label htmlFor="tokenStandard" className="label">Token Standard
            <select
              id="tokenStandard"
              required
              className="form__input"
              value={product.tokenStandard || ''}
              onChange={(e) => { setProduct((p) => ({ ...p, tokenStandard: e.target.value })); }}
            >
              <option value="">Select</option>
              <option value="Erc20">ERC20</option>
              <option value="Erc721">ERC721</option>
            </select>
          </label>
        </div>

        {isNFT && (
          <div className="form__field">
            <label htmlFor="tokenId" className="label">Token ID
              <input
                id="tokenId"
                type="text"
                required
                className="form__input"
                value={product.tokenId || ''}
                placeholder="Token ID for the NFT"
                onChange={(e) => { setProduct((p) => ({ ...p, tokenId: e.target.value })); }}
              />
            </label>
          </div>
        )}

        <div className="form__field">
          <label htmlFor="imageUrl" className="label">Image URL
            <input
              id="imageUrl"
              type="text"
              className="form__input"
              value={product.imageUrl || ''}
              placeholder="Image URL for the product"
              onChange={(e) => { setProduct((p) => ({ ...p, imageUrl: e.target.value })); }}
            />
          </label>
        </div>

        <div className="form__field">
          <label htmlFor="availableQuantity" className="label">Available Quantity
            <input
              id="availableQuantity"
              type="number"
              className="form__input"
              readOnly={isNFT}
              value={isNFT ? 1 : (product.availableQuantity || '')}
              placeholder="Quantity Available for sale"
              onChange={(e) => { setProduct((p) => ({ ...p, availableQuantity: Number(e.target.value) })); }}
            />
          </label>
        </div>

        <div className="form__field">
          <label htmlFor="price" className="label">Price in ETH
            <input
              id="price"
              type="number"
              className="form__input"
              value={product.price || ''}
              placeholder="Price of the product in ETH"
              onChange={(e) => { setProduct((p) => ({ ...p, price: Number(e.target.value) })); }}
            />
          </label>
        </div>

        <button
          type="submit"
          className="button"
        >
          Submit
        </button>

      </form>

    </div>
  );
}

export default AddProductPage;
