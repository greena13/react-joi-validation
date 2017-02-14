import React from 'react';
import TestUtils from 'react-addons-test-utils';
import validate from '../../index';

import Joi from 'joi-browser';

import refreshComponentState from '../support/refreshComponentState';

import WrappedComponent from '../WrappedComponent';

validate.setJoi(Joi);

describe('validateAll', function(){
  const joiSchema = {
    a: Joi.string().required()
  };

  beforeEach(function () {
    this.refreshComponentState = refreshComponentState.bind(this);
    this.renderer = TestUtils.createRenderer();

    this.ValidatedComponent = validate(WrappedComponent, { joiSchema });

    this.renderer.render(<this.ValidatedComponent />);
    this.refreshComponentState();
  });

  describe('when called', function(){
    it('then validates all attributes', function(){
      this.component.props.validateAll();

      this.refreshComponentState();

      expect(this.component.props.errors).toEqual({ a: 'is required'});
    });

   });

  describe('when passed a callback function', function(){
    it('then it calls the callback', function(){
      this.callback = function() { };

      spyOn(this, 'callback');

      this.component.props.validateAll(this.callback);
      this.refreshComponentState();

      expect(this.component.props.errors).toEqual({ a: 'is required'});
      expect(this.callback).toHaveBeenCalled();
    });
   });
});
