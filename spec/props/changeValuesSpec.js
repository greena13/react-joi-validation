import React from 'react';
import TestUtils from 'react-addons-test-utils';
import validate from '../../index';
import each from 'lodash.foreach';

import Joi from 'joi-browser';

import refreshComponentState from '../support/refreshComponentState';

import WrappedComponent from '../WrappedComponent';

validate.setJoi(Joi);

describe('changeValues', function(){
  const joiSchema = {
    a: Joi.string().required()
  };

  beforeEach(function () {
    this.oldDefaultProps =  WrappedComponent.defaultProps;

    this.refreshComponentState = refreshComponentState.bind(this);
    this.renderer = TestUtils.createRenderer();

    this.ValidatedComponent = validate(WrappedComponent, { joiSchema });

    this.renderer.render(<this.ValidatedComponent />);
    this.refreshComponentState();
  });

  afterEach(function() {
    WrappedComponent.defaultProps = this.oldDefaultProps;
  });

  describe('when passed a array of name and value tuples', function(){
    it('then updates all the attributes to their new values', function(){

      const values = [
        ['a', undefined],
        ['b', null] ,
        ['c', 0],
        ['d', 23],
        ['e', 'value'],
        ['f', [1,2,3] ],
        ['g', [{ a: 'a', b: 'b'}, { a: 'c', b: 'd' }], { a: 'a', b: 'b' } ]
      ];

      this.component.props.changeValues(values);
      this.refreshComponentState();

      each(values, ([attributeName, value]) => {
        expect(this.component.props[attributeName]).toEqual(value);
      })
    });
   });

  describe('when passed an array of name and path tuples', function(){
    it('then updates the values at each path with the new value', function(){
      const values = [
        ['a', {}],
        ['a.b', 'c'] ,
        ['a.d[0]', 23],
        ['a.d[1]', { e: 'e' }]
      ];

      this.component.props.changeValues(values);
      this.refreshComponentState();

      expect(this.component.props.a).toEqual({ b: 'c', d: [23, { e: 'e' }]});
    });
   });

  describe('when no validate option is provided', function(){
    it('then does not validate the new value', function(){
      this.component.props.changeValues([['a', null]]);

      this.refreshComponentState();

      expect(this.component.props.a).toEqual(null);
      expect(this.component.props.errors).toEqual({});
    });
   });

  describe('when the validate option is true', function(){
    it('then it validates the value that is changing', function(){
      this.component.props.changeValues([['a', null]], { validate: true });

      this.refreshComponentState();

      expect(this.component.props.a).toEqual(null);
      expect(this.component.props.errors).toEqual({ a: 'must be a string' });
    });
   });

  describe('when the validate option is false', function(){
    it('then does not validate the new value', function(){
      this.component.props.changeValues([['a', null]], { validate: false });

      this.refreshComponentState();

      expect(this.component.props.a).toEqual(null);
      expect(this.component.props.errors).toEqual({});
    });
   });

  describe('when the validate option is a string', function(){
    it('then it validates the attribute mentioned in the string', function(){
      this.component.props.changeValues([['b', null]], { validate: 'a' });

      this.refreshComponentState();

      expect(this.component.props.a).toEqual(undefined);
      expect(this.component.props.b).toEqual(null);

      expect(this.component.props.errors).toEqual({ a: 'is required' });
    });
   });

  describe('when the validate option is an array', function(){
    it('then it validates each attribute mentioned in the array', function(){
      this.component.props.changeValues([['b', null]], { validate: ['a'] });

      this.refreshComponentState();

      expect(this.component.props.a).toEqual(undefined);
      expect(this.component.props.b).toEqual(null);

      expect(this.component.props.errors).toEqual({ a: 'is required' });
    });
   });

  describe('when the callback option is a function and the value is not validated', function(){
    it('then it does not call the callback', function(){
      this.callback = function() { };

      spyOn(this, 'callback');

      this.component.props.changeValues([['b', null]], { callback: this.callback });

      expect(this.callback).not.toHaveBeenCalled();
    });
   });

  describe('when the callback option is a function and the value is validated', function(){
    it('then it calls the callback', function(){
      this.callback = function() { };

      spyOn(this, 'callback');

      this.component.props.changeValues([['b', null]], { validate: true, callback: this.callback });

      expect(this.callback).toHaveBeenCalled();
    });
   });


});
