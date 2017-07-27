import React from 'react';
import ShallowRenderer from 'react-test-renderer/shallow';
import validate from '../../index';
import each from 'lodash.foreach';

import Joi from 'joi-browser';

import refreshComponentState from '../support/refreshComponentState';

import WrappedComponent from '../WrappedComponent';

validate.setJoi(Joi);

describe('changeValue', () => {
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

  describe('when passed a attribute name and value', () => {
    it('then updates that attribute with the new value', function(){

      const values = [ undefined, null, 0, 23, 'value', [1, 2, 3], [{ a: 'a', b: 'b' }, { a: 'c', b: 'd' }], { a: 'a', b: 'b' } ];

      each(values, (value) => {
        this.component.props.changeValue('a', value);

        this.refreshComponentState();

        expect(this.component.props.a).toEqual(value);
      })
    });
   });

  describe('when passed a path', () => {
    it('then updates the value at that path with the new value', function(){
      this.component.props.changeValue('a.b', { c: 'c' });

      this.refreshComponentState();
      expect(this.component.props.a.b.c).toEqual('c');

      this.component.props.changeValue('a.b.c', [0, 1, 2, 3]);

      this.refreshComponentState();
      expect(this.component.props.a.b.c).toEqual([0, 1, 2, 3]);

      this.component.props.changeValue('a.b.c[2]', 4);

      this.refreshComponentState();
      expect(this.component.props.a.b.c).toEqual([0, 1, 4, 3]);

      this.component.props.changeValue('a.b.c[0]', { d: 'd' });

      this.refreshComponentState();
      expect(this.component.props.a.b.c[0]).toEqual({ d: 'd' });

      this.component.props.changeValue('a.b.c[0]', { d: 'e' });

      this.refreshComponentState();
      expect(this.component.props.a.b.c[0]).toEqual({ d: 'e' });
    });
   });

  describe('when no validate option is provided', () => {
    it('then does not validate the new value', function(){
      this.component.props.changeValue('a', null);

      this.refreshComponentState();

      expect(this.component.props.a).toEqual(null);
      expect(this.component.props.errors).toEqual({});
    });
   });

  describe('when the validate option is true', () => {
    it('then it validates the value that is changing', function(){
      this.component.props.changeValue('a', null, { validate: true });

      this.refreshComponentState();

      expect(this.component.props.a).toEqual(null);
      expect(this.component.props.errors).toEqual({ a: 'must be a string' });
    });
   });

  describe('when the validate option is false', () => {
    it('then does not validate the new value', function(){
      this.component.props.changeValue('a', null, { validate: false });

      this.refreshComponentState();

      expect(this.component.props.a).toEqual(null);
      expect(this.component.props.errors).toEqual({});
    });
   });

  describe('when the validate option is a string', () => {
    it('then it validates the attribute mentioned in the string', function(){
      this.component.props.changeValue('b', null, { validate: 'a' });

      this.refreshComponentState();

      expect(this.component.props.a).toEqual(undefined);
      expect(this.component.props.b).toEqual(null);

      expect(this.component.props.errors).toEqual({ a: 'is required' });
    });
   });

  describe('when the validate option is an array', () => {
    it('then it validates each attribute mentioned in the array', function(){
      this.component.props.changeValue('b', null, { validate: ['a'] });

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

      this.component.props.changeValue('b', null, { callback: this.callback });

      expect(this.callback).not.toHaveBeenCalled();
    });
   });

  describe('when the callback option is a function and the value is validated', () => {
    it('then it dose call the callback', function(){
      this.callback = function() { };

      spyOn(this, 'callback');

      this.component.props.changeValue('b', null, { validate: true, callback: this.callback });

      expect(this.callback).toHaveBeenCalled();
    });
   });


});
