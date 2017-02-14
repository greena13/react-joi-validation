import React, { PropTypes, Component } from 'react';

class WrappedComponent extends Component {

  render() {
    return(
      <div >
        ValidatedComponent
      </div>
    );
  }

}

WrappedComponent.propTypes = {

};

WrappedComponent.defaultProps = {

};

module.exports = WrappedComponent;
