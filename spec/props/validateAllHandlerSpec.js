import React from 'react';
import ShallowRenderer from 'react-test-renderer/shallow';
import validate from '../../react-joi-validation.development';

import Joi from 'joi-browser';

import refreshComponentState from '../support/refreshComponentState';

import WrappedComponent from '../WrappedComponent';

validate.setJoi(Joi);

describe('validateAllHandler', () => {
  const joiSchema = {
    a: Joi.string().required()
  };

  beforeEach(function () {
    this.refreshComponentState = refreshComponentState.bind(this);
    this.renderer = new ShallowRenderer();

    this.ValidatedComponent = validate(WrappedComponent, { joiSchema });

    this.renderer.render(<this.ValidatedComponent />);
    this.refreshComponentState();
  });

  describe('when called', () => {
    it('then returns a function that validates all attribute each time it is called', function(){
      const validateAllHandler = this.component.props.validateAllHandler();

      validateAllHandler();

      this.refreshComponentState();

      expect(this.component.props.errors).toEqual({ a: 'is required' });
    });

   });

  describe('when passed a callback function', () => {
    it('then it calls the callback', function(){
      this.callback = function() { };

      spyOn(this, 'callback');

      const validateAllHandler = this.component.props.validateAllHandler(this.callback);
      validateAllHandler();

      this.refreshComponentState();

      expect(this.component.props.errors).toEqual({ a: 'is required' });
      expect(this.callback).toHaveBeenCalled();
    });
   });
});
