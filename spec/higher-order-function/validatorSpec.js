import React from 'react';
import TestUtils from 'react-addons-test-utils';
import validate from '../../index'
import Joi from 'joi-browser';
import each from 'lodash.foreach';
import map from 'lodash.map';
import omit from 'lodash.omit';

import expectComponentToHaveErrors from '../support/expectComponentToHaveErrors';
import expectComponentToHaveProps from '../support/expectComponentToHaveProps';
import refreshComponentState from '../support/refreshComponentState';

import WrappedComponent from '../WrappedComponent';

validate.setJoi(Joi);

describe('higher order function when the validator option', function(){

  beforeEach(function() {
    this.oldDefaultProps =  WrappedComponent.defaultProps;

    this.refreshComponentState = refreshComponentState.bind(this);
    this.renderer = TestUtils.createRenderer();

    this.expectComponentToHaveProps = expectComponentToHaveProps.bind(this);
    this.expectComponentToHaveErrors = expectComponentToHaveErrors.bind(this);

    this.expectToBeCalledWhenValidating = expectToBeCalledWhenValidating.bind(this);
    this.expectNotToBeCalledWhenChangingValues = expectNotToBeCalledWhenChangingValues.bind(this);
  });

  afterEach(function() {
    WrappedComponent.defaultProps = this.oldDefaultProps;
  });

  describe('is a single function', function(){
    beforeEach(function(){
      this.validator = function({ values, errors }, callback) {
        callback({ values, errors });
      };
    });

    describe('and the joiSchema option is specified', function(){
      const joiSchema = {
        username: Joi.string().required(),
        password: Joi.string().required(),
        passwordConfirmation: Joi.string().required()
      };

      const joiErrors = {
        username: 'must be a string',
        password: 'is required',
        passwordConfirmation: 'is required'
      };

      beforeEach(function() {

        spyOn(this, 'validator').and.callThrough();

        this.ValidatedComponent = validate(WrappedComponent, { joiSchema, validator: this.validator });
      });

      it('then doesn\'t get called when changing values', function(){
        this.expectNotToBeCalledWhenChangingValues(this.validator);
      });

      it('then gets called when validating', function(){
        this.expectToBeCalledWhenValidating(this.validator, { errors: joiErrors});
      });

     });

    describe('and the only option is not specified', function(){
      beforeEach(function() {

        spyOn(this, 'validator').and.callThrough();

        this.ValidatedComponent = validate(WrappedComponent, { validator: this.validator });
      });

      it('then doesn\'t get called when changing values', function(){
        this.expectNotToBeCalledWhenChangingValues(this.validator);
      });

      it('then gets called when validating', function(){
        this.expectToBeCalledWhenValidating(this.validator);
      });

     });

    describe('and the only option is a string', function(){
      beforeEach(function() {

        spyOn(this, 'validator').and.callThrough();

        this.ValidatedComponent = validate(WrappedComponent, { validator: this.validator, only: 'user' });
      });

      it('then doesn\'t get called when changing values', function(){
        this.expectNotToBeCalledWhenChangingValues(this.validator);
      });

      it('then gets called when validating', function(){
        this.expectToBeCalledWhenValidating(this.validator);
      });

     });

    describe('and the only option is any array', function(){
      beforeEach(function() {

        spyOn(this, 'validator').and.callThrough();

        this.ValidatedComponent = validate(WrappedComponent, { validator: this.validator, only: ['user'] });
      });

      it('then doesn\'t get called when changing values', function(){
        this.expectNotToBeCalledWhenChangingValues(this.validator, { nestedUnder: 'user' });
      });

      it('then gets called when validating', function(){
        this.expectToBeCalledWhenValidating(this.validator, { nestedUnder: 'user', errors: {} });
      });

     });
  });

  describe('is a single function and the joiSchema option is specified and the validator changes a Joi error', function(){
    const joiSchema = {
      username: Joi.string().required()
    };

    beforeEach(function () {
      this.validator = function({ values }, callback) {
        callback({ values, errors: { } });
      };

      spyOn(this, 'validator').and.callThrough();

      this.ValidatedComponent = validate(WrappedComponent, { joiSchema, validator: this.validator });
    });

    it('then uses the new value for the error', function(){
      this.renderer.render(<this.ValidatedComponent />);

      this.refreshComponentState();

      this.component.props.changeValue('username', null, { validate: true });

      expect(this.validator.calls.argsFor(0)[0]).toEqual({
        errors: { username: 'must be a string' },
        values: { username: null },
        touchedValues: ['username'],
        validatedValues: ['username'],
        changingValues: ['username'],
        validateAllValues: false,
        valuesWithDefaults: { username: null },
        props: {}
      });

      this.refreshComponentState();

      expect(this.component.props.errors).toEqual({});
    });

  });

  describe('is an array of functions', function(){
    beforeEach(function(){
      this.validator1 = function({ values, errors}, callback) {
        callback({ values, errors });
      };

      this.validator2 = function({ values, errors}, callback) {
        callback({ values, errors });
      };

    });

    describe('and the joiSchema option is specified', function(){
      const joiSchema = {
        username: Joi.string().required(),
        password: Joi.string().required(),
        passwordConfirmation: Joi.string().required()
      };

      const joiErrors = {
        username: 'must be a string',
        password: 'is required',
        passwordConfirmation: 'is required'
      };

      beforeEach(function() {

        spyOn(this, 'validator1').and.callThrough();
        spyOn(this, 'validator2').and.callThrough();

        this.ValidatedComponent = validate(WrappedComponent, { joiSchema, validator: [this.validator1, this.validator2] });
      });

      it('then doesn\'t get called when changing values', function(){
        this.expectNotToBeCalledWhenChangingValues([this.validator1, this.validator2]);
      });

      it('then gets called when validating', function(){
        this.expectToBeCalledWhenValidating([this.validator1, this.validator2], { errors: joiErrors });
      });

    });

    describe('and the only option is not specified', function(){
      beforeEach(function() {

        spyOn(this, 'validator1').and.callThrough();
        spyOn(this, 'validator2').and.callThrough();

        this.ValidatedComponent = validate(WrappedComponent, { validator: [this.validator1, this.validator2] });
      });

      it('then doesn\'t get called when changing values', function(){
        this.expectNotToBeCalledWhenChangingValues([this.validator1, this.validator2]);
      });

      it('then gets called when validating', function(){
        this.expectToBeCalledWhenValidating([this.validator1, this.validator2]);
      });

     });

    describe('and the only option is a string', function(){
      beforeEach(function() {

        spyOn(this, 'validator1').and.callThrough();
        spyOn(this, 'validator2').and.callThrough();

        this.ValidatedComponent = validate(WrappedComponent, { validator: [this.validator1, this.validator2], only: 'user' });
      });

      it('then doesn\'t get called when changing values', function(){
        this.expectNotToBeCalledWhenChangingValues([this.validator1, this.validator2]);
      });

      it('then gets called when validating', function(){
        this.expectToBeCalledWhenValidating([this.validator1, this.validator2]);
      });

     });

    describe('and the only option is any array', function(){
      beforeEach(function() {

        spyOn(this, 'validator1').and.callThrough();
        spyOn(this, 'validator2').and.callThrough();

        this.ValidatedComponent = validate(WrappedComponent, { validator: [this.validator1, this.validator2], only: ['user'] });
      });

      it('then doesn\'t get called when changing values', function(){
        this.expectNotToBeCalledWhenChangingValues([this.validator1, this.validator2], { nestedUnder: 'user' });
      });

      it('then gets called when validating', function(){
        this.expectToBeCalledWhenValidating([this.validator1, this.validator2], { errors: {}, nestedUnder: 'user' });
      });

     });

    describe('and a validators changes values and errors', function(){
      beforeEach(function() {
        this.validator1 = function({ values, errors}, callback) {
          callback({
            values: { ...values, username: '******' },
            errors: { ...errors, username: 'contains profanity'
            }
          });
        };

        this.validator2 = function({ values, errors}, callback) {
          callback({ values, errors });
        };


        spyOn(this, 'validator1').and.callThrough();
        spyOn(this, 'validator2').and.callThrough();

        this.ValidatedComponent = validate(WrappedComponent, { validator: [ this.validator1, this.validator2 ] });
      });

      it('then passes the new values and errors to subsequent validators', function(){
        this.renderer.render(<this.ValidatedComponent />);

        this.refreshComponentState();

        this.component.props.changeValue('username', 'rudeWord', { validate: true });

        expect(this.validator1.calls.argsFor(0)[0]).toEqual({
          errors: {},
          values: { username: 'rudeWord' },
          touchedValues: ['username'],
          validatedValues: ['username'],
          changingValues: ['username'],
          validateAllValues: false,
          valuesWithDefaults: { username: 'rudeWord' },
          props: {}
        });

        expect(this.validator2.calls.argsFor(0)[0]).toEqual({
          errors: { username: 'contains profanity' },
          values: { username: '******' },
          touchedValues: ['username'],
          validatedValues: ['username'],
          changingValues: ['username'],
          validateAllValues: false,
          valuesWithDefaults: { username: 'rudeWord' },
          props: {}
        });

        this.refreshComponentState();

        expect(this.component.props.errors).toEqual({ username: 'contains profanity' });
        expect(this.component.props.username).toEqual('******');

      });
     });
  });

 });

function expectNotToBeCalledWhenChangingValues(validators, { nestedUnder } = {}) {
  const validatorList = [].concat(validators);

  this.renderer.render(<this.ValidatedComponent />);

  this.refreshComponentState();

  this.component.props.changeValue(adaptPath('username', nestedUnder), null);

  const changeHandler = this.component.props.changeHandler(adaptPath('password', nestedUnder));
  changeHandler('123');

  this.component.props.changeValue(adaptPath('passwordConfirmation', nestedUnder), null, { validate: false });

  each(validatorList, (validator) => {
    expect(validator).not.toHaveBeenCalled();
  });
}

function adaptPaths(paths, nestedUnder) {
  return map(paths, (path) => adaptPath(path, nestedUnder));
}

function adaptPath(path, nestedUnder) {
  if (nestedUnder) {
    return `${nestedUnder}.${path}`;
  } else {
    return path;
  }
}

function adaptObject(obj, nestedUnder) {
  if (nestedUnder) {
    return { [nestedUnder]: obj };
  } else {
    return obj;
  }
}

function expectToBeCalledWhenValidating(validators, { nestedUnder, errors } = { errors: {}}) {
  const validatorList = [].concat(validators);

  this.renderer.render(<this.ValidatedComponent />);

  this.refreshComponentState();

  this.component.props.changeValue(adaptPath('username', nestedUnder), null, { validate: true });

  each(validatorList, (validator) => {
    expect(validator.calls.argsFor(0)[0]).toEqual({
      errors,
      values: adaptObject({ username: null }, nestedUnder),
      touchedValues: adaptPaths(['username'], nestedUnder),
      validatedValues: adaptPaths(['username'], nestedUnder),
      changingValues: adaptPaths(['username'], nestedUnder),
      validateAllValues: false,
      valuesWithDefaults: adaptObject({ username: null }, nestedUnder),
      props: {}
    });
  });

  this.component.props.changeValue(adaptPath('username', nestedUnder), 'user123', { validate: adaptPath('password', nestedUnder) });

  each(validatorList, (validator) => {
    expect(validator.calls.argsFor(1)[0]).toEqual({
      errors: omit(errors, 'username'),
      values: adaptObject({ username: 'user123' }, nestedUnder),
      touchedValues: adaptPaths(['username'], nestedUnder),
      validatedValues: adaptPaths(['username', 'password'], nestedUnder),
      changingValues: adaptPaths(['username'], nestedUnder),
      validateAllValues: false,
      valuesWithDefaults: adaptObject({ username: 'user123' }, nestedUnder),
      props: {}
    });
  });

  const changeHandler2 = this.component.props.changeHandler(adaptPath('password', nestedUnder), { validate: true });
  changeHandler2(null, '123');

  each(validatorList, (validator) => {
    expect(validator.calls.argsFor(2)[0]).toEqual({
      errors: omit(errors, ['username', 'password']),
      values: adaptObject({ username: 'user123', password: '123' }, nestedUnder),
      touchedValues: adaptPaths(['username', 'password'], nestedUnder),
      validatedValues: adaptPaths(['username', 'password'], nestedUnder),
      changingValues: adaptPaths(['password'], nestedUnder),
      validateAllValues: false,
      valuesWithDefaults: adaptObject({ username: 'user123', password: '123' }, nestedUnder),
      props: {}
    });
  });

  const changeHandler3 = this.component.props.changeHandler(adaptPath('passwordConfirmation', nestedUnder), { validate: adaptPath('password', nestedUnder) });
  changeHandler3(null, '123');

  each(validatorList, (validator) => {
    expect(validator.calls.argsFor(3)[0]).toEqual({
      errors: omit(errors, ['username', 'password', 'passwordConfirmation']),
      values: adaptObject({ username: 'user123', password: '123', passwordConfirmation: '123' }, nestedUnder),
      touchedValues: adaptPaths(['username', 'password', 'passwordConfirmation'], nestedUnder),
      validatedValues: adaptPaths(['username', 'password' ], nestedUnder),
      changingValues: adaptPaths(['passwordConfirmation'], nestedUnder),
      validateAllValues: false,
      valuesWithDefaults: adaptObject({ username: 'user123', password: '123', passwordConfirmation: '123' }, nestedUnder),
      props: {}
    });
  });

  this.component.props.validate(adaptPath('passwordConfirmation', nestedUnder));

  each(validatorList, (validator) => {
    expect(validator.calls.argsFor(4)[0]).toEqual({
      errors: omit(errors, ['username', 'password', 'passwordConfirmation']),
      values: adaptObject({ username: 'user123', password: '123', passwordConfirmation: '123' }, nestedUnder),
      touchedValues: adaptPaths(['username', 'password', 'passwordConfirmation'], nestedUnder),
      validatedValues: adaptPaths(['username', 'password', 'passwordConfirmation' ], nestedUnder),
      changingValues: [],
      validateAllValues: false,
      valuesWithDefaults: adaptObject({ username: 'user123', password: '123', passwordConfirmation: '123' }, nestedUnder),
      props: {}
    });
  });

  this.component.props.validateAll();

  each(validatorList, (validator) => {
    expect(validator.calls.argsFor(5)[0]).toEqual({
      errors: omit(errors, ['username', 'password', 'passwordConfirmation']),
      values: adaptObject({ username: 'user123', password: '123', passwordConfirmation: '123' }, nestedUnder),
      touchedValues: adaptPaths(['username', 'password', 'passwordConfirmation'], nestedUnder),
      validatedValues: adaptPaths(['username', 'password', 'passwordConfirmation' ], nestedUnder),
      changingValues: [],
      validateAllValues: true,
      valuesWithDefaults: adaptObject({ username: 'user123', password: '123', passwordConfirmation: '123' }, nestedUnder),
      props: {}
    });
  });
}
