import React from 'react';
import Joi from 'joi-browser';
import ShallowRenderer from 'react-test-renderer/shallow';

import validate, { useFirstArgument, useSecondArgument, useThirdArgument, guessCorrectValue } from '../../react-joi-validation.development';
import WrappedComponent from '../WrappedComponent';
import refreshComponentState from '../support/refreshComponentState';

validate.setJoi(Joi);

describe('Change handler transform:', () => {
  const joiSchema = {
    a: Joi.string().required()
  };

  describe('when not specified', () => {
    beforeEach(function () {
      this.refreshComponentState = refreshComponentState.bind(this);
      this.renderer = new ShallowRenderer();

      this.ValidatedComponent = validate(WrappedComponent, { joiSchema });

      this.renderer.render(<this.ValidatedComponent />);
      this.refreshComponentState();
    });

    it('then uses the default', function(){
      const changeHandler = this.component.props.changeHandler('a');

      changeHandler(null, 'secondArg');

      this.refreshComponentState();

      expect(this.component.props.a).toEqual('secondArg');
    });
  });

  describe('when specified using the global setChangeHandlerStrategy()', () => {
    beforeEach(function () {
      validate.setChangeHandlerStrategy(useFirstArgument);
      this.refreshComponentState = refreshComponentState.bind(this);
      this.renderer = new ShallowRenderer();

      this.ValidatedComponent = validate(WrappedComponent, { joiSchema });

      this.renderer.render(<this.ValidatedComponent />);
      this.refreshComponentState();
    });

    afterEach(function() {
       validate.setChangeHandlerStrategy(guessCorrectValue);
    });

    it('then uses the specified handler transform', function(){
      const changeHandler = this.component.props.changeHandler('a');

      changeHandler('firstArg');

      this.refreshComponentState();

      expect(this.component.props.a).toEqual('firstArg');
    });
  });

  describe('when specified using the global setChangeHandlerStrategy() and validate\'s changeHandlerStrategy option', () => {
    beforeEach(function () {
      validate.setChangeHandlerStrategy(useFirstArgument);

      this.refreshComponentState = refreshComponentState.bind(this);
      this.renderer = new ShallowRenderer();

      this.ValidatedComponent = validate(WrappedComponent, { joiSchema, changeHandlerStrategy: useSecondArgument });

      this.renderer.render(<this.ValidatedComponent />);
      this.refreshComponentState();
    });

    afterEach(function() {
      validate.setChangeHandlerStrategy(guessCorrectValue);
    });

    it('then uses the change handler transform specified using changeHandlerStrategy', function(){
      const changeHandler = this.component.props.changeHandler('a');

      changeHandler('firstArg', 'secondArg');

      this.refreshComponentState();

      expect(this.component.props.a).toEqual('secondArg');
    });
  });

  describe('when only validate\'s changeHandlerStrategy option', () => {
    beforeEach(function () {
      this.refreshComponentState = refreshComponentState.bind(this);
      this.renderer = new ShallowRenderer();

      this.ValidatedComponent = validate(WrappedComponent, { joiSchema, changeHandlerStrategy: useSecondArgument });

      this.renderer.render(<this.ValidatedComponent />);
      this.refreshComponentState();
    });

    it('then uses the change handler transform specified using changeHandlerStrategy', function(){
      const changeHandler = this.component.props.changeHandler('a');

      changeHandler('firstArg', 'secondArg');

      this.refreshComponentState();

      expect(this.component.props.a).toEqual('secondArg');
    });
  });

  describe('when specified using the global setChangeHandlerStrategy(), validate\'s changeHandlerStrategy option and changeHandler\'s strategy option', () => {
    beforeEach(function () {
      validate.setChangeHandlerStrategy(useFirstArgument);

      this.refreshComponentState = refreshComponentState.bind(this);
      this.renderer = new ShallowRenderer();

      this.ValidatedComponent = validate(WrappedComponent, { joiSchema, changeHandlerStrategy: useSecondArgument });

      this.renderer.render(<this.ValidatedComponent />);
      this.refreshComponentState();
    });

    afterEach(function() {
      validate.setChangeHandlerStrategy(guessCorrectValue);
    });

    it('then uses the change handler transform specified using the strategy option', function(){
      const changeHandler = this.component.props.changeHandler('a', { strategy: useThirdArgument });

      changeHandler('firstArg', 'secondArg', 'thirdArgument');

      this.refreshComponentState();

      expect(this.component.props.a).toEqual('thirdArgument');
    });
  });

  describe('when specified using only the changeHandler\'s strategy option', () => {
    beforeEach(function () {
      this.refreshComponentState = refreshComponentState.bind(this);
      this.renderer = new ShallowRenderer();

      this.ValidatedComponent = validate(WrappedComponent, { joiSchema });

      this.renderer.render(<this.ValidatedComponent />);
      this.refreshComponentState();
    });

    it('then uses the change handler transform specified using the strategy option', function(){
      const changeHandler = this.component.props.changeHandler('a', { strategy: useThirdArgument });

      changeHandler('firstArg', 'secondArg', 'thirdArgument');

      this.refreshComponentState();

      expect(this.component.props.a).toEqual('thirdArgument');
    });
  });
});
