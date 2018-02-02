import React from 'react';
import ShallowRenderer from 'react-test-renderer/shallow';
import validate from '../../index';

import Joi from 'joi-browser';

import refreshComponentState from '../support/refreshComponentState';

import WrappedComponent from '../WrappedComponent';

validate.setJoi(Joi);

describe('toggleUnshiftHandler', () => {
  const joiSchema = {
    a: Joi.array().min(2).required()
  };

  beforeEach(function () {
    this.oldDefaultProps = WrappedComponent.defaultProps;

    this.refreshComponentState = refreshComponentState.bind(this);
    this.renderer = new ShallowRenderer();

    this.ValidatedComponent = validate(WrappedComponent, { joiSchema });

    this.renderer.render(<this.ValidatedComponent />);
    this.refreshComponentState();
  });

  afterEach(function() {
    WrappedComponent.defaultProps = this.oldDefaultProps;
  });

  describe('when passed a attribute name', () => {
    it('then returns a function that toggles including and excluding a value to the attribute each time it is called', function(){
      const toggleUnshiftHandler = this.component.props.toggleUnshiftHandler('a');

      toggleUnshiftHandler(null, 1);
      this.refreshComponentState();
      expect(this.component.props.a).toEqual([1]);

      toggleUnshiftHandler(null, 2);
      this.refreshComponentState();
      expect(this.component.props.a).toEqual([2, 1]);

      toggleUnshiftHandler(null, 1);
      this.refreshComponentState();
      expect(this.component.props.a).toEqual([2]);

      toggleUnshiftHandler(null, 2);
      this.refreshComponentState();
      expect(this.component.props.a).toEqual([]);

      toggleUnshiftHandler(null, 1);
      this.refreshComponentState();
      expect(this.component.props.a).toEqual([1]);
    });

    describe('and a value option', () => {
      it('then returns a function that appends values to the attribute each time it is called', function(){

        const toggleUnshiftHandler = this.component.props.toggleUnshiftHandler('a', { value: 1 });

        toggleUnshiftHandler();
        this.refreshComponentState();
        expect(this.component.props.a).toEqual([1]);

        toggleUnshiftHandler();
        this.refreshComponentState();
        expect(this.component.props.a).toEqual([]);
      });
     });
   });

  describe('when no validate option is provided', () => {
    it('then does not validate the new value', function(){
      const toggleUnshiftHandler = this.component.props.toggleUnshiftHandler('a');
      toggleUnshiftHandler(null, null);

      this.refreshComponentState();

      expect(this.component.props.a).toEqual([null]);
      expect(this.component.props.errors).toEqual({});
    });
   });

  describe('when the validate option is true', () => {
    it('then it validates the value that is changing', function(){
      const toggleUnshiftHandler = this.component.props.toggleUnshiftHandler('a', { validate: true });
      toggleUnshiftHandler(null, null);

      this.refreshComponentState();

      expect(this.component.props.a).toEqual([null]);
      expect(this.component.props.errors).toEqual({ a: 'must contain at least 2 items' });
    });
   });

  describe('when the validate option is false', () => {
    it('then does not validate the new value', function(){
      const toggleUnshiftHandler = this.component.props.toggleUnshiftHandler('a', { validate: false });
      toggleUnshiftHandler(null, null);

      this.refreshComponentState();

      expect(this.component.props.a).toEqual([null]);
      expect(this.component.props.errors).toEqual({});
    });
   });

});
