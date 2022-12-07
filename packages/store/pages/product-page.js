import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, gql, useMutation } from '@apollo/client';
import { TokenStandard } from '../common/constants';
import { ZkopruContext } from '../context/zkopru-context';

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

const createOrderQuery = gql`
  mutation createOrder($orderInput: CreateOrderInput!) {
    createOrder(order: $orderInput) {
      id
      buyerTransactionHash
      sellerTransactionHash
      status
    }
  }
`;

function ProductPage() {
  const [quantity, setQuantity] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);

  const { id } = useParams();
  const navigate = useNavigate();
  const { isInitialized, generateSwapTransaction } = React.useContext(ZkopruContext);

  const [createOrderMutation] = useMutation(createOrderQuery);

  const { loading, data = {} } = useQuery(getProductQuery, {
    variables: { id },
  });
  const { product = {} } = data;
  const isNFT = product?.tokenStandard === TokenStandard.ERC721;

  React.useEffect(() => {
    if (isNFT) {
      setQuantity(1);
    }
  }, [product]);

  async function onSubmit(e) {
    e.preventDefault();

    if (!isInitialized) {
      // eslint-disable-next-line no-alert
      alert('Please connect to Zkopru');
      return;
    }

    try {
      setIsLoading(true);
      const { customerTransaction, swapSalt } = await generateSwapTransaction({
        product,
        quantity,
      });

      const createdOrder = await createOrderMutation({
        variables: {
          orderInput: {
            productId: product.id,
            quantity,
            buyerAddress: process.env.MERCHANT_ADDRESS,
            buyerTransaction: customerTransaction,
            atomicSwapSalt: swapSalt,
          },
        },
      });

      navigate(`/orders/${createdOrder.id}`);
    } catch (error) {
      // eslint-disable-next-line no-alert
      alert(`Error ocurred while creating tx: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="page product-page">

      <div className="page-title">
        Product - {product.name}
      </div>

      <div className="flex-row">
        <div className={`product-image ${loading ? 'loading' : ''}`}>
          {product.imageUrl && (
            <img src={product.imageUrl} alt={product.name} />
          )}
        </div>

        <div className={`section ${loading ? 'loading' : ''}`}>
          <h2 className="product-page__name">
            {product.name}
          </h2>
          <div className="product-page__description">
            {product.description}
          </div>

          <div className="section__label">Contract</div>
          <div className="section__value">{product.tokenStandard?.toUpperCase()} - {product.contractAddress}</div>

          {isNFT ? (
            <>
              <div className="section__label">Token Id</div>
              <div className="section__value">{product.tokenId}</div>
            </>
          ) : (
            <>
              <div className="section__label">Available Quantity</div>
              <div className="section__value">{product.availableQuantity}</div>
            </>
          )}

          <div className="section__label">Price</div>
          <div className="section__value">
            <span className="section__unit">Ξ</span> {product.price}
          </div>
          <hr />

          <form onSubmit={onSubmit}>
            <div className="product-page__quantity">

              {!isNFT && (
                <div>
                  <div className="section__label">Required Quantity</div>
                  <input
                    type="number"
                    className="product-page__input"
                    placeholder="Quantity"
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    max={product.availableQuantity}
                  />
                </div>
              )}

              <div>
                <div className="section__label">Total</div>
                <div className="section__value mt-4">Ξ {product.price * quantity}</div>
              </div>
            </div>

            <button
              type="submit"
              className={`submit-button + ${isLoading ? 'submit-button--loading' : ''}`}
              disabled={loading}
            >
              <span />
              {!isLoading && 'Purchase'}
            </button>
          </form>

        </div>
      </div>

    </div>
  );
}

export default ProductPage;
