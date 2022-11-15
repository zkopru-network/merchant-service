import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, gql } from '@apollo/client';

const createProductQuery = gql`
  mutation createProduct($productInput: ProductInput!) {
    createProduct(product: $productInput) {
      id
      name
      price
      availableQuantity
      tokenStandard
      tokenId
    }
  }
`;

function CreateProductPage() {
  const navigate = useNavigate();

  const [product, setProduct] = React.useState({});

  const [createProductMutation] = useMutation(createProductQuery);

  const isNFT = product.tokenStandard === 'Erc721';

  async function onSubmit(e) {
    e.preventDefault();
    e.stopPropagation();

    await createProductMutation({ variables: { productInput: product } });
    navigate('/products');
  }

  return (
    <div className="page products-page">

      <div className="page-title">
        Add Product
      </div>

      <form className="form new-product-form" onSubmit={onSubmit}>

        <div className="field">
          <label htmlFor="productName" className="label">Name</label>
          <input
            id="productName"
            required
            type="text"
            className="form-input"
            value={product.name || ''}
            placeholder="Product name"
            onChange={(e) => { setProduct((p) => ({ ...p, name: e.target.value })); }}
          />
        </div>

        <div className="field">
          <label htmlFor="description" className="label">Description</label>
          <input
            id="description"
            type="text"
            className="form-input"
            value={product.description || ''}
            placeholder="A small description on what this product is"
            onChange={(e) => { setProduct((p) => ({ ...p, description: e.target.value })); }}
          />
        </div>

        <div className="field">
          <label htmlFor="contractAddress" className="label">Contract Address</label>
          <input
            id="contractAddress"
            type="text"
            required
            className="form-input"
            value={product.contractAddress || ''}
            placeholder="Contract address of the token"
            onChange={(e) => { setProduct((p) => ({ ...p, contractAddress: e.target.value })); }}
          />
        </div>

        <div className="field">
          <label htmlFor="tokenStandard" className="label">Token Standard</label>
          <select
            id="tokenStandard"
            required
            className="form-input"
            value={product.tokenStandard || ''}
            onChange={(e) => { setProduct((p) => ({ ...p, tokenStandard: e.target.value })); }}
          >
            <option value="">Select</option>
            <option value="Erc20">ERC20</option>
            <option value="Erc721">ERC721</option>
          </select>
        </div>

        {isNFT && (
          <div className="field">
            <label htmlFor="tokenId" className="label">Token ID</label>
            <input
              id="tokenId"
              type="text"
              required
              className="form-input"
              value={product.tokenId || ''}
              placeholder="Token ID for the NFT"
              onChange={(e) => { setProduct((p) => ({ ...p, tokenId: e.target.value })); }}
            />
          </div>
        )}

        <div className="field">
          <label htmlFor="imageUrl" className="label">Image URL</label>
          <input
            id="imageUrl"
            type="text"
            className="form-input"
            value={product.imageUrl || ''}
            placeholder="Image URL for the product"
            onChange={(e) => { setProduct((p) => ({ ...p, imageUrl: e.target.value })); }}
          />
        </div>

        <div className="field">
          <label htmlFor="availableQuantity" className="label">Available Quantity</label>
          <input
            id="availableQuantity"
            type="number"
            className="form-input"
            readOnly={isNFT}
            value={isNFT ? 1 : (product.availableQuantity || '')}
            placeholder="Quantity Available for sale"
            onChange={(e) => { setProduct((p) => ({ ...p, availableQuantity: Number(e.target.value) })); }}
          />
        </div>

        <div className="field">
          <label htmlFor="price" className="label">Price in ETH</label>
          <input
            id="price"
            type="number"
            className="form-input"
            value={product.price || ''}
            placeholder="Price of the product in ETH"
            onChange={(e) => { setProduct((p) => ({ ...p, price: Number(e.target.value) })); }}
          />
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

export default CreateProductPage;
