import React from 'react';

export default function ErrorView(props) {
  const { error } = props;

  return (
    <div className="section section--error">

      <div className="section__title">
        Unexpected error ocurred
      </div>

      <p>
        {error.message}
      </p>

    </div>
  );
}
