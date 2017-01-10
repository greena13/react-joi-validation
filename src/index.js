'use strict';

import React, { PropTypes, Component } from 'react';

import set from 'lodash.set';
import get from 'lodash.get';
import reduce from 'lodash.reduce';
import defaultsDeep from 'lodash.defaultsdeep';
import includes from 'lodash.includes';
import without from 'lodash.without';

import isString from 'lodash.isstring';

import emptyFunc from './utils/emptyFunc';
import arrayFrom from './utils/arrayFrom';
import pickDeep from './utils/pickDeep';
import pickOutermost from './utils/pickOutermost';

let Joi;

const ALL_PATHS_SYMBOL = '*';
const DEFAULT_STATE = {
  errors: {},
  values: {},
  touchedValues: {},

  validateAllValues: false
};

function includesAllValues(valuePaths) {
  if (Array.isArray(valuePaths)) {
    return includes(valuePaths, ALL_PATHS_SYMBOL);
  } else {
    return valuePaths === ALL_PATHS_SYMBOL;
  }
}

const ReactJoiValidation = (ValidatedComponent, { joiSchema, joiOptions, validator, only }) => {
  function usingSingularValidationScope(){
    return isString(only);
  }

  function scopedPath(valuePath) {
    if (usingSingularValidationScope() && !includesAllValues(valuePath)) {
      return `${only}.${valuePath}`;
    } else {
      return valuePath;
    }
  }

  function wrapObject(object){
    if (usingSingularValidationScope()) {
      return {
        [only]: object
      };
    } else {
      return object;
    }
  }

  function unwrapObject(object){
    if (usingSingularValidationScope()) {
      return object[only];
    } else {
      return object;
    }
  }

  function pickErrors(errors, touchedValues){
    const listOfTouchedValues = pickOutermost(touchedValues);

    return reduce(listOfTouchedValues, (activeErrors, valuePath) => {
      set(activeErrors, valuePath, get(errors, valuePath));
      return activeErrors;
    },{});
  }

  class ValidatorComponent extends Component {
    constructor(props, context) {
      super(props, context);

      this.changeHandler = this.changeHandler.bind(this);
      this.handleChange = this.handleChange.bind(this);

      this.validateHandler = this.validateHandler.bind(this);
      this.validate = this.validate.bind(this);

      this.validateAll = this.validateAll.bind(this);
      this.validateAllHandler = this.validateAllHandler.bind(this);

      this.clear = this.clear.bind(this);

      this.state = { ...DEFAULT_STATE };
    }

    render() {
      return(
        <ValidatedComponent
          { ...this.props }
          { ...this._valuesWithDefaults() }

          errors={ this._getActiveErrors() }

          changeHandler={ this.changeHandler }
          changeValue={ this.handleChange }

          validateHandler={ this.validateHandler }
          validate={ this.validate }

          validateAllHandler={ this.validateAllHandler }
          validateAll={ this.validateAll }

          clearValidationState={ this.clear }
        />
      );
    }

    _getActiveErrors(){
      const { errors, validateAllValues, touchedValues } = this.state;

      const activeErrors = function(){
        if (validateAllValues) {
          return errors;
        } else {
          return pickErrors(errors, touchedValues);
        }
      }();

      return unwrapObject(activeErrors) || {};
    }

    clear() {
      this.setState({
        ...DEFAULT_STATE
      });
    }

    _valuesWithDefaults({ scope } = { }){

      if (only) {

        const validateableFields = arrayFrom(only);

        const propValues = pickDeep(this.props, validateableFields);

        const defaultValues = pickDeep(
          ValidatedComponent.defaultProps, validateableFields
        );

        const values = defaultsDeep({},
          this.state.values,
          propValues,
          defaultValues
        );

        if (scope) {
          return unwrapObject(values);
        } else {
          return values;
        }

      } else {

        return defaultsDeep({},
          this.state.values,
          this.props,
          ValidatedComponent.defaultProps
        );

      }

    }

    changeHandler(valuePath, options = {}) {

      return (event, value) => {
        this.handleChange(valuePath, options.value || value, options);
      };

    }

    handleChange(valuePath, value, options = {}){
      const { values, touchedValues } = this.state;

      this.setState({
        values: set({ ...values }, scopedPath(valuePath), value),
        touchedValues: { ...touchedValues, [valuePath]: true }
      }, () => {
        if (options.validate) {
          this.validate(options.validate === true ? valuePath : options.validate)
        }
      });

    }

    validateAllHandler(callback = emptyFunc) {

      return () => {
        this.validateAll(callback);
      };

    }

    validateAll(callback) {
      this.validate(ALL_PATHS_SYMBOL, callback);
    }

    validateHandler(valuePaths, callback = emptyFunc()) {

      return () => {
        this.validate(valuePaths, callback)
      }

    }

    validate(valuePaths, afterValidationCallback = emptyFunc) {

      const valuePathsAsList = arrayFrom(valuePaths);
      const afterValidationHandler = this._afterValidationHandler(valuePathsAsList, afterValidationCallback);

      const valuesToValidate = this._valuesWithDefaults({ scope: true });

      if (joiSchema) {
        Joi.validate(valuesToValidate, joiSchema, { abortEarly: false, ...joiOptions }, (joiError) => {
          const joiErrorList = (joiError && joiError.details) || [];

          const errorObject = reduce(joiErrorList, (errors, { message, path }) => {
            const messageWithFieldNameRemoved = message.replace(/^\".+\" /, '');

            set(errors, path, messageWithFieldNameRemoved);

            return errors;
          }, {});

          this._passToValidatorIfValidatingAll(
            valuePaths,
            valuesToValidate,
            errorObject,
            afterValidationHandler
          );
        })

      } else {

        this._passToValidatorIfValidatingAll(
          valuePaths,
          valuesToValidate,
          {},
          afterValidationHandler
        )

      }
    }

    _passToValidatorIfValidatingAll(valuePaths, values, errors, afterValidatorHasRun) {

      if (validator) {
        validator({
          valuePaths: without(valuePaths, ALL_PATHS_SYMBOL),
          validateAll: includesAllValues(valuePaths),
          values, errors
        }, afterValidatorHasRun);
      } else {
        afterValidatorHasRun({ values, errors });
      }
    }

    _afterValidationHandler(valuePaths, afterValidationComplete) {
      return ({ values, errors })=>{
        const { validateAllValues } = this.state;

        const newState = {
          values: wrapObject(values),
          errors: wrapObject(errors),
          touchedValues: this._mergeTouchedValues(valuePaths),
          validateAllValues: validateAllValues || includesAllValues(valuePaths)
        };

        this.setState(newState, afterValidationComplete);
      };
    }

    _mergeTouchedValues(valuePaths){
      const { touchedValues } = this.state;

      return reduce(valuePaths, (newTouchedValues, valuePath)=>{
        const effectivePath = scopedPath(valuePath);

        if (effectivePath !== ALL_PATHS_SYMBOL) {
          set(newTouchedValues, effectivePath, effectivePath);
        }

        return newTouchedValues;
      }, { ...touchedValues });
    }

  }

  ValidatorComponent.propTypes = {
    onSubmit: PropTypes.func,
    errors: PropTypes.object,
    onChange: PropTypes.func
  };

  return ValidatorComponent;
};

ReactJoiValidation.setJoi = function(joiClass) {
  Joi = joiClass;
};

export default ReactJoiValidation;