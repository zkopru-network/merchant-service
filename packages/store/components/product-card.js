import React from 'react';
import { fromWei } from 'web3-utils';

function ProductCard(props) {
  const {
    product, loading,
  } = props;

  if (loading) {
    return (
      <div className="product-card loading" />
    );
  }

  return (
    <div className="product-card">

      <div className="product-card__image">
        <img src={product.imageUrl} alt={product.name} />
      </div>

      <div className="product-card__details">
        <div>
          <div className="product-card__name">{product.name}</div>
          <div className="product-card__type">{product.tokenStandard?.toUpperCase()}</div>
        </div>
        <div className="product-card__price"><span className="product-card__unit">Ξ</span> {fromWei(product.price)}</div>
      </div>

    </div>
  );
}

export default ProductCard;
