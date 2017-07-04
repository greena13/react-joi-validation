import React from 'react';
import ShallowRenderer from 'react-test-renderer/shallow';
import validate from '../../index';

import Joi from 'joi-browser';

import refreshComponentState from '../support/refreshComponentState';

import WrappedComponent from '../WrappedComponent';

validate.setJoi(Joi);

describe('clearValidationAndResetValues', () => {
  const joiSchema = {
    a: Joi.string().required(),
    b: Joi.string().required()
  };

  beforeEach(function () {
    this.refreshComponentState = refreshComponentState.bind(this);
    this.renderer = new ShallowRenderer();

    this.ValidatedComponent = validate(WrappedComponent, { joiSchema });

    this.renderer.render(<this.ValidatedComponent />);
    this.refreshComponentState();
  });

  describe('when called with no arguments', () => {
    it('then clears all errors and values', function(){
      this.component.props.changeValue('a', 'a');
      this.component.props.validateAll();

      this.refreshComponentState();

      expect(this.component.props.a).toEqual('a');
      expect(this.component.props.errors).toEqual({ b: 'is required' });

      this.component.props.clearValidationAndResetValues();

      this.refreshComponentState();

      expect(this.component.props.a).toEqual(undefined);
      expect(this.component.props.errors).toEqual({});
    });

  });

  describe('when called with a string', () => {
    it('then clears errors and values for the attribute mentioned in that string', function(){
      this.component.props.changeValue('a', 'a');
      this.component.props.validateAll();

      this.refreshComponentState();

      expect(this.component.props.a).toEqual('a');
      expect(this.component.props.errors).toEqual({ b: 'is required' });

      this.component.props.clearValidationAndResetValues('a');

      this.refreshComponentState();

      expect(this.component.props.a).toEqual(undefined);
      expect(this.component.props.errors).toEqual({ b: 'is required' });
    });

  });

  describe('when called with an array string', () => {
    it('then clears errors and values for the attributes mentioned in the array', function(){
      this.component.props.changeValue('a', 'a');
      this.component.props.validateAll();

      this.refreshComponentState();

      expect(this.component.props.a).toEqual('a');
      expect(this.component.props.errors).toEqual({ b: 'is required' });

      this.component.props.clearValidationAndResetValues(['a']);

      this.refreshComponentState();

      expect(this.component.props.a).toEqual(undefined);
      expect(this.component.props.errors).toEqual({ b: 'is required' });
    });

  });
});
