import React from 'react';
import ShallowRenderer from 'react-test-renderer/shallow';
import validate from '../../index';
import each from 'lodash.foreach';

import Joi from 'joi-browser';

import refreshComponentState from '../support/refreshComponentState';

import WrappedComponent from '../WrappedComponent';

validate.setJoi(Joi);

describe('changeHandler', () => {
  const joiSchema = {
    a: Joi.string().required()
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
    it('then returns a function that updates that attribute each time it is called', function(){
      const changeHandler = this.component.props.changeHandler('a');

      const values = [ undefined, null, 0, 23, 'value', [1, 2, 3], [{ a: 'a', b: 'b' }, { a: 'c', b: 'd' }], { a: 'a', b: 'b' } ];

      each(values, (value) => {
        changeHandler(null, value);

        this.refreshComponentState();

        expect(this.component.props.a).toEqual(value);
      })
    });

    describe('and a value option', () => {
      it('then returns a function that updates the attribute to the value specified', function(){

        const values = [ undefined, null, 0, 23, 'value', [1, 2, 3], [{ a: 'a', b: 'b' }, { a: 'c', b: 'd' }], { a: 'a', b: 'b' } ];

        each(values, (value) => {
          const changeHandler = this.component.props.changeHandler('a', { value });

          changeHandler();

          this.refreshComponentState();

          expect(this.component.props.a).toEqual(value);
        })
      });
     });
   });

  describe('when passed a path', () => {
    it('then returns a function that updates that attribute each time it is called', function(){
          const changeHandler1 = this.component.props.changeHandler('a.b');
          changeHandler1(null, { c: 'c' });

      this.refreshComponentState();
      expect(this.component.props.a.b.c).toEqual('c');

      const changeHandler2 = this.component.props.changeHandler('a.b.c');
      changeHandler2(null, [0, 1, 2, 3]);

      this.refreshComponentState();
      expect(this.component.props.a.b.c).toEqual([0, 1, 2, 3]);

      const changeHandler3 = this.component.props.changeHandler('a.b.c[2]');
      changeHandler3(null, 4);

      this.refreshComponentState();
      expect(this.component.props.a.b.c).toEqual([0, 1, 4, 3]);

      const changeHandler4 = this.component.props.changeHandler('a.b.c[0]');
      changeHandler4(null, { d: 'd' });

      this.refreshComponentState();
      expect(this.component.props.a.b.c[0]).toEqual({ d: 'd' });

      const changeHandler5 = this.component.props.changeHandler('a.b.c[0]');
      changeHandler5(null, { d: 'e' });

      this.refreshComponentState();
      expect(this.component.props.a.b.c[0]).toEqual({ d: 'e' });
    });
   });

  describe('when no validate option is provided', () => {
    it('then does not validate the new value', function(){
      const changeHandler = this.component.props.changeHandler('a');
      changeHandler(null, null);

      this.refreshComponentState();

      expect(this.component.props.a).toEqual(null);
      expect(this.component.props.errors).toEqual({});
    });
   });

  describe('when the validate option is true', () => {
    it('then it validates the value that is changing', function(){
      const changeHandler = this.component.props.changeHandler('a', { validate: true });
      changeHandler(null, null);

      this.refreshComponentState();

      expect(this.component.props.a).toEqual(null);
      expect(this.component.props.errors).toEqual({ a: 'must be a string' });
    });
   });

  describe('when the validate option is false', () => {
    it('then does not validate the new value', function(){
      const changeHandler = this.component.props.changeHandler('a', { validate: false });
      changeHandler(null, null);

      this.refreshComponentState();

      expect(this.component.props.a).toEqual(null);
      expect(this.component.props.errors).toEqual({});
    });
   });

  describe('when the validate option is a string', () => {
    it('then it validates the attribute mentioned in the string', function(){
      const changeHandler = this.component.props.changeHandler('b', { validate: 'a' });
      changeHandler(null, null);

      this.refreshComponentState();

      expect(this.component.props.a).toEqual(undefined);
      expect(this.component.props.b).toEqual(null);

      expect(this.component.props.errors).toEqual({ a: 'is required' });
    });
   });

  describe('when the validate option is an array', () => {
    it('then it validates each attribute mentioned in the array', function(){
      const changeHandler = this.component.props.changeHandler('b', { validate: ['a'] });
      changeHandler(null, null);

      this.refreshComponentState();

      expect(this.component.props.a).toEqual(undefined);
      expect(this.component.props.b).toEqual(null);

      expect(this.component.props.errors).toEqual({ a: 'is required' });
    });
   });

  describe('when the callback option is a function and the value is not validated', () => {
    it('then it does not call the callback', function(){
      this.callback = function() { };

      spyOn(this, 'callback');

      const changeHandler = this.component.props.changeHandler('b', { callback: this.callback });
      changeHandler(null, null);

      expect(this.callback).not.toHaveBeenCalled();
    });
   });

  describe('when the callback option is a function and the value is validated', () => {
    it('then it calls the callback', function(){
      this.callback = function() { };

      spyOn(this, 'callback');

      const changeHandler = this.component.props.changeHandler('b', { validate: true, callback: this.callback });
      changeHandler(null, null);

      expect(this.callback).toHaveBeenCalled();
    });
   });


});
