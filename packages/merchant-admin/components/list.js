import React from 'react';
import { Link } from 'react-router-dom';

export default function List(props) {
  const {
    loading, items = [], fields, formatters, redirectTo, keyField = 'id',
  } = props;

  function renderColumns(item) {
    return (
      <div className="columns">
        {Object.keys(fields).map((f) => (
          <div key={f} className="column list-item__value">
            {formatters[f] ? formatters[f](item[f], item) : item[f]}
          </div>
        ))}
      </div>
    );
  }

  function renderListItem(item) {
    return (
      redirectTo ? (
        <Link to={redirectTo(item)} key={item[keyField]} className="list-item list-item--clickable">
          {renderColumns(item)}
        </Link>
      ) : (
        <div key={item[keyField]} className="list-item">
          {renderColumns(item)}
        </div>
      )
    );
  }

  return (
    <div className="list">
      <div className="columns list__header">
        {Object.keys(fields).map((f) => (
          <div key={f} className="column list__title">{fields[f]}</div>
        ))}
      </div>

      {loading && (
        <>
          <div className="list-item list-item--loading" />
          <div className="list-item list-item--loading" />
          <div className="list-item list-item--loading" />
        </>
      )}

      {!loading && items.map(renderListItem)}
    </div>
  );
}
