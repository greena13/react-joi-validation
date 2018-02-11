import React from 'react';
import ShallowRenderer from 'react-test-renderer/shallow';
import validate from '../../react-joi-validation.development';
import each from 'lodash.foreach';

import Joi from 'joi-browser';

import refreshComponentState from '../support/refreshComponentState';

import WrappedComponent from '../WrappedComponent';

validate.setJoi(Joi);

describe('unshiftHandler', () => {
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
    it('then returns a function that prepends values to the attribute each time it is called', function(){
      const unshiftHandler = this.component.props.unshiftHandler('a');

      const values = [ undefined, null, 0, 23, 'value', [1, 2, 3], [{ a: 'a', b: 'b' }, { a: 'c', b: 'd' }], { a: 'a', b: 'b' } ];

      each(values, (value, index) => {
        unshiftHandler(null, value);

        this.refreshComponentState();
        expect(this.component.props.a).toEqual(values.slice(0, index + 1).reverse());
      });

    });

    describe('and an allowDuplicates option of false', () => {
      it('then returns a function that will only add a value to the array the first time it is called', function(){

        const unshiftHandler = this.component.props.unshiftHandler('a', { allowDuplicates: false });

        unshiftHandler(null, 1);
        this.refreshComponentState();
        expect(this.component.props.a).toEqual([1]);

        unshiftHandler(null, 1);
        this.refreshComponentState();
        expect(this.component.props.a).toEqual([1]);
      });
    });

    describe('and a value option', () => {
      it('then returns a function that prepends values to the attribute each time it is called', function(){

        const values = [ undefined, null, 0, 23, 'value', [1, 2, 3], [{ a: 'a', b: 'b' }, { a: 'c', b: 'd' }], { a: 'a', b: 'b' } ];

        each(values, (value, index) => {
          const unshiftHandler = this.component.props.unshiftHandler('a', { value });

          unshiftHandler();

          this.refreshComponentState();
          expect(this.component.props.a).toEqual(values.slice(0, index + 1).reverse());
        });

      });
     });
   });

  describe('when no validate option is provided', () => {
    it('then does not validate the new value', function(){
      const unshiftHandler = this.component.props.unshiftHandler('a');
      unshiftHandler(null, null);

      this.refreshComponentState();

      expect(this.component.props.a).toEqual([null]);
      expect(this.component.props.errors).toEqual({});
    });
   });

  describe('when the validate option is true', () => {
    it('then it validates the value that is changing', function(){
      const unshiftHandler = this.component.props.unshiftHandler('a', { validate: true });
      unshiftHandler(null, null);

      this.refreshComponentState();

      expect(this.component.props.a).toEqual([null]);
      expect(this.component.props.errors).toEqual({ a: 'must contain at least 2 items' });
    });
   });

  describe('when the validate option is false', () => {
    it('then does not validate the new value', function(){
      const unshiftHandler = this.component.props.unshiftHandler('a', { validate: false });
      unshiftHandler(null, null);

      this.refreshComponentState();

      expect(this.component.props.a).toEqual([null]);
      expect(this.component.props.errors).toEqual({});
    });
   });

});
