import React from 'react';
import { Link } from 'react-router-dom';

function ProductView(props) {
  const {
    product, loading, totalSold, showLink,
  } = props;

  const isNFT = product?.tokenStandard === 'Erc721';

  if (loading) {
    return (
      <div className="section section__loading">
        Loading
      </div>
    );
  }

  return (
    <div className="section mb-5">

      {showLink && (
        <Link className="product-view__link" to={`/products/${product.id}`}>
          <i className="icon icon-link" />
        </Link>
      )}

      <div className="section__title">
        {product.name}
      </div>
      <div className="section__description">
        {product.description}
      </div>

      <div className="product-view__container">

        <div className="product-view__image">
          <img src={product.imageUrl} alt={product.name} />
        </div>

        <div className="product-view__details">
          <div className="product-view__label">Contract</div>
          <div className="product-view__value">{product.tokenStandard?.toUpperCase()} - {product.contractAddress}</div>

          <div className="product-view__label">Price</div>
          <div className="product-view__value">Ξ {product.price}</div>

          {isNFT ? (
            <>
              <div className="product-view__label">Token Id</div>
              <div className="product-view__value">{product.tokenId}</div>
            </>
          ) : (
            <>
              <div className="product-view__label">Available Quantity</div>
              <div className="product-view__value">{product.availableQuantity}</div>
            </>
          )}

          {totalSold !== undefined && (
            <>
              <div className="product-view__label">Total Sold</div>
              <div className="product-view__value">{totalSold}</div>
            </>
          )}

        </div>

      </div>
    </div>
  );
}

export default ProductView;
