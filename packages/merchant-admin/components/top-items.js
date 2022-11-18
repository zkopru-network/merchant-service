import React from 'react';

export default function TopItems(props) {
  const {
    loading, items = [], title, itemName, nameKey = 'name',
    valueKey = 'value', valueFormatter, nameFormatter, valueLabel = 'Count',
  } = props;

  function renderListItem(item) {
    return (
      <div key={item[nameKey]} className="top-item">
        <div className="top-item__name">
          {nameFormatter ? nameFormatter(item[nameKey]) : item[nameKey]}
        </div>
        <div className="top-item__value">
          {valueFormatter ? valueFormatter(item[valueKey]) : item[valueKey]}
        </div>
      </div>
    );
  }

  return (
    <div className="top-items">

      <div className="top-items__title">{title}</div>

      {(loading || items.length) > 0 && (
        <div className="top-items__header">
          <div>{itemName}</div>
          <div>{valueLabel}</div>
        </div>
      )}

      {loading && (
        <>
          <div className="top-item top-item--loading" />
          <div className="top-item top-item--loading" />
          <div className="top-item top-item--loading" />
        </>
      )}

      {!loading && items.length === 0 && (
        <div>
          No {itemName}s found
        </div>
      )}

      {!loading && items.length > 0 && items.map(renderListItem)}
    </div>
  );
}
