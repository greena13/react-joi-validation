import React from 'react';
import ShallowRenderer from 'react-test-renderer/shallow';
import validate from '../../react-joi-validation.development';

import Joi from 'joi-browser';

import refreshComponentState from '../support/refreshComponentState';

import WrappedComponent from '../WrappedComponent';

validate.setJoi(Joi);

describe('validateHandler', () => {
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

  describe('when passed a attribute name', () => {
    it('then returns a function that validates that attribute each time it is called', function(){
      const validateHandler = this.component.props.validateHandler('a');

      validateHandler();

      this.refreshComponentState();

      expect(this.component.props.errors).toEqual({ a: 'is required' });
    });

   });

  describe('when passed an array', () => {
    it('then returns a function that validates the attributes mentioned in the array each time it\'s called', function(){
      const validateHandler = this.component.props.validateHandler(['a']);

      validateHandler();

      this.refreshComponentState();

      expect(this.component.props.errors).toEqual({ a: 'is required' });
    });
   });

  describe('when the callback option is a function', () => {
    it('then it calls the callback', function(){
      this.callback = function() { };

      spyOn(this, 'callback');

      const validateHandler = this.component.props.validateHandler('a', this.callback);
      validateHandler();

      this.refreshComponentState();

      expect(this.component.props.errors).toEqual({ a: 'is required' });
      expect(this.callback).toHaveBeenCalled();
    });
   });
});
