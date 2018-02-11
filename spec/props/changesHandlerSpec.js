import React from 'react';
import ShallowRenderer from 'react-test-renderer/shallow';
import validate from '../../react-joi-validation.development';
import each from 'lodash.foreach';

import Joi from 'joi-browser';

import refreshComponentState from '../support/refreshComponentState';

import WrappedComponent from '../WrappedComponent';

validate.setJoi(Joi);

describe('changesHandler', () => {
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

  describe('when passed a array of name and value tuples', () => {
    it('then returns a function that when called, updates all the attributes to their new values', function(){

      const values = [
        ['a', undefined],
        ['b', null],
        ['c', 0],
        ['d', 23],
        ['e', 'value'],
        ['f', [1, 2, 3] ],
        ['g', [{ a: 'a', b: 'b' }, { a: 'c', b: 'd' }], { a: 'a', b: 'b' } ]
      ];

      const changesHandler = this.component.props.changesHandler(values);
      changesHandler();

      this.refreshComponentState();

      each(values, ([attributeName, value]) => {
        expect(this.component.props[attributeName]).toEqual(value);
      })
    });
   });

  describe('when passed an array of name and path tuples', () => {
    it('then returns a function that when called, updates all the attributes at the specified paths to their new values', function(){
      const values = [
        ['a', {}],
        ['a.b', 'c'],
        ['a.d[0]', 23],
        ['a.d[1]', { e: 'e' }]
      ];

      const changesHandler = this.component.props.changesHandler(values);
      changesHandler();

      this.refreshComponentState();

      expect(this.component.props.a).toEqual({ b: 'c', d: [23, { e: 'e' }] });
    });
   });

  describe('when no validate option is provided', () => {
    it('then does not validate the new values', function(){
      const changesHandler = this.component.props.changesHandler([['a', null]]);

      changesHandler();
      this.refreshComponentState();

      expect(this.component.props.a).toEqual(null);
      expect(this.component.props.errors).toEqual({});
    });
   });

  describe('when the validate option is true', () => {
    it('then it validates the values that are changing', function(){
      const changesHandler = this.component.props.changesHandler([['a', null]], { validate: true });
      changesHandler();

      this.refreshComponentState();

      expect(this.component.props.a).toEqual(null);
      expect(this.component.props.errors).toEqual({ a: 'must be a string' });
    });
   });

  describe('when the validate option is false', () => {
    it('then does not validate the new values', function(){
      const changesHandler = this.component.props.changesHandler([['a', null]], { validate: false });
      changesHandler();

      this.refreshComponentState();

      expect(this.component.props.a).toEqual(null);
      expect(this.component.props.errors).toEqual({});
    });
   });

  describe('when the validate option is a string', () => {
    it('then it validates the attribute mentioned in the string', function(){
      const changesHandler = this.component.props.changesHandler([['b', null]], { validate: 'a' });
      changesHandler();

      this.refreshComponentState();

      expect(this.component.props.a).toEqual(undefined);
      expect(this.component.props.b).toEqual(null);

      expect(this.component.props.errors).toEqual({ a: 'is required' });
    });
   });

  describe('when the validate option is an array', () => {
    it('then it validates each attribute mentioned in the array', function(){
      const changesHandler = this.component.props.changesHandler([['b', null]], { validate: ['a'] });
      changesHandler();

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

      const changesHandler = this.component.props.changesHandler([['b', null]], { callback: this.callback });
      changesHandler();

      expect(this.callback).not.toHaveBeenCalled();
    });
   });

  describe('when the callback option is a function and the value is validated', () => {
    it('then it calls the callback', function(){
      this.callback = function() { };

      spyOn(this, 'callback');

      const changesHandler = this.component.props.changesHandler([['b', null]], { validate: true, callback: this.callback });
      changesHandler();

      expect(this.callback).toHaveBeenCalled();
    });
   });


});
