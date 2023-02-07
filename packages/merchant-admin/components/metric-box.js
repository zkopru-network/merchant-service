import { useNavigate } from 'react-router';

function MetricBox(props) {
  const {
    label, value, unit, style, showChangeIndicator, loading, to,
  } = props;

  const navigate = useNavigate();

  let className = 'metric-box';
  if (loading) {
    className += ' metric-box--loading';
  }
  if (to) {
    className += ' is-link';
  }

  return (
    <div
      style={style}
      className={className}
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...to && { onClick: () => navigate(to) }}
    >
      {!loading && (
        <>
          <div className="metric-box__label">{label}</div>
          <div className="flex-row">
            {showChangeIndicator && value && value > 0 && <span className="metric-box__indicator">&#9650;</span>}
            {showChangeIndicator && value && value < 0 && <span className="metric-box__indicator">&#9660;</span>}
            <div className="metric-box__value">
              {value}
            </div>
            {value !== undefined && unit !== undefined && (<div className="metric-box__unit">{unit}</div>)}
          </div>
        </>
      )}
    </div>
  );
}

export default MetricBox;
