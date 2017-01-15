'use strict';

import React, { PropTypes, Component } from 'react';

import set from 'lodash.set';
import get from 'lodash.get';

import has from 'lodash.has';
import includes from 'lodash.includes';
import without from 'lodash.without';

import isString from 'lodash.isstring';

import reduce from 'lodash.reduce';
import defaultsDeep from 'lodash.defaultsdeep';
import deepClone from 'lodash.clonedeep';
import map from 'lodash.map';

import emptyFunc from './utils/emptyFunc';
import arrayFrom from './utils/arrayFrom';
import pickDeep from './utils/pickDeep';
import pickOutermost from './utils/pickOutermost';
import mergeTouchedValues from './utils/mergeTouchedValues';
import valuesWithDefaultsAndExemptions from './utils/valuesWithDefaultsAndExemptions';

import Wildcard from './constants/Wildcard';

let Joi;

const DEFAULT_STATE = {
  errors: {},
  values: {},
  touchedValues: {},

  validateAllValues: false
};

function includesAllValues(valuePaths) {
  if (Array.isArray(valuePaths)) {
    return includes(valuePaths, Wildcard);
  } else {
    return valuePaths === Wildcard;
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

      if (!valuePath.endsWith(Wildcard)) {
        set(activeErrors, valuePath, get(errors, valuePath));
      }

      return activeErrors;
    }, {});
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
      const { touchedValues } = this.state;

      if (only) {
        const validateableFields = arrayFrom(only);

        const propValues = pickDeep(this.props, validateableFields);

        const defaultValues = pickDeep(
          ValidatedComponent.defaultProps, validateableFields
        );

        const exemptions = pickDeep(touchedValues, validateableFields);

        const propsWithDefaults = defaultsDeep({}, propValues, defaultValues);

        const values = valuesWithDefaultsAndExemptions({
          defaultValue: propsWithDefaults,
          overrides: this.state.values,
          deepMergeExemptions: exemptions
        });

        if (scope) {
          return unwrapObject(values);
        } else {
          return values;
        }

      } else {
        const propsWithDefaults = defaultsDeep({}, this.props, ValidatedComponent.defaultProps);

        return valuesWithDefaultsAndExemptions({
          defaultValue: propsWithDefaults,
          overrides: this.state.values,
          deepMergeExemptions: touchedValues
        });
      }

    }

    changeHandler(valuePath, options = {}) {
      return (event, value) => {
        const valueToUse = has(options, 'value') ? options.value : value;
        this.handleChange(valuePath, valueToUse, options);
      };

    }

    handleChange(valuePath, value, options = {}){
      const { values, touchedValues } = this.state;

      const newValues = deepClone(values);

      set(newValues, scopedPath(valuePath), value);

      this.setState({
        values: newValues,
        touchedValues: mergeTouchedValues([ scopedPath(valuePath) ], touchedValues)
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
      this.validate(Wildcard, callback);
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

          this._callValidatorIfDefined(
            valuePathsAsList,
            valuesToValidate,
            errorObject,
            afterValidationHandler
          );
        })

      } else {

        this._callValidatorIfDefined(
          valuePathsAsList,
          valuesToValidate,
          {},
          afterValidationHandler
        )

      }
    }

    _callValidatorIfDefined(valuePaths, values, errors, afterValidatorHasRun) {

      if (validator) {
        validator({
          valuePaths: without(valuePaths, Wildcard),
          validateAll: includesAllValues(valuePaths),
          values, errors
        }, afterValidatorHasRun);
      } else {
        afterValidatorHasRun({ values, errors });
      }
    }

    _afterValidationHandler(valuePaths, afterValidationComplete) {
      return ({ values, errors })=>{
        const { validateAllValues, touchedValues } = this.state;

        const scopedValuePaths = map(valuePaths, function(valuePath){
          return scopedPath(valuePath);
        });

        const newState = {
          values: wrapObject(values),
          errors: wrapObject(errors),
          touchedValues: mergeTouchedValues(scopedValuePaths, touchedValues),
          validateAllValues: validateAllValues || includesAllValues(valuePaths)
        };

        this.setState(newState, afterValidationComplete);
      };
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
