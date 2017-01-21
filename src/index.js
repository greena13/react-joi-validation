'use strict';

import React, { PropTypes, Component } from 'react';

import set from 'lodash.set';
import get from 'lodash.get';
import drop from 'lodash.drop';

import has from 'lodash.has';

import isString from 'lodash.isstring';

import reduce from 'lodash.reduce';
import defaultsDeep from 'lodash.defaultsdeep';
import deepClone from 'lodash.clonedeep';
import each from 'lodash.foreach';
import map from 'lodash.map';

import invariant from 'invariant';

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

const ReactJoiValidation = (ValidatedComponent, { joiSchema, joiOptions, validator, only, pseudoValues = [] }) => {
  function usingSingularValidationScope(){
    return isString(only);
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

    const valuesToPick = [
      ...listOfTouchedValues,
      ...arrayFrom(pseudoValues)
    ];

    return reduce(valuesToPick, (activeErrors, valuePath) => {

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
      this.changesHandler = this.changesHandler.bind(this);
      this.changeValue = this.changeValue.bind(this);
      this.changeValues = this.changeValues.bind(this);

      this.validateHandler = this.validateHandler.bind(this);
      this.validate = this.validate.bind(this);

      this.validateAll = this.validateAll.bind(this);
      this.validateAllHandler = this.validateAllHandler.bind(this);

      this.clear = this.clear.bind(this);

      this.state = { ...DEFAULT_STATE };
    }

    render() {
      const { touchedValues, values } = this.state;

      return(
        <ValidatedComponent
          { ...this.props }
          { ...this._valuesWithDefaults({ values, touchedValues }) }

          errors={ this._getActiveErrors() }

          changeHandler={ this.changeHandler }
          changesHandler={ this.changesHandler }
          changeValue={ this.changeValue }
          changeValues={ this.changeValues }

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

      if (validateAllValues) {
        return errors;
      } else {
        return pickErrors(errors, touchedValues);
      }
    }

    _valuesWithDefaults({ values, touchedValues }){

      if (only) {
        const validateableFields = arrayFrom(only);

        const propValues = pickDeep(this.props, validateableFields);

        const defaultValues = pickDeep(
          ValidatedComponent.defaultProps, validateableFields
        );

        const propsWithDefaults = defaultsDeep({}, propValues, defaultValues);

        return valuesWithDefaultsAndExemptions({
          defaultValue: propsWithDefaults,
          overrides: wrapObject(values),
          deepMergeExemptions: wrapObject(touchedValues)
        });

      } else {
        const propsWithDefaults = defaultsDeep({}, this.props, ValidatedComponent.defaultProps);

        return valuesWithDefaultsAndExemptions({
          defaultValue: propsWithDefaults,
          overrides: wrapObject(values),
          deepMergeExemptions: wrapObject(touchedValues)
        });
      }

    }

    clear() {
      this.setState({
        ...DEFAULT_STATE
      });
    }

    changeHandler(valuePath, options = {}) {
      return (event, value) => {
        const valueToUse = has(options, 'value') ? options.value : value;
        this.changeValue(valuePath, valueToUse, options);
      };
    }

    changeValue(valuePath, value, options = {}){
      invariant(!Array.isArray(valuePath),
        'Value path passed to changeValue was an array. If you want to change multiple values at once, use `changeValues` (pluralized) instead.'
      );

      this.changeValues([[valuePath, value]], options)
    }

    changesHandler(changes, options) {
      return () => {
        this.changeValues(changes, options);
      };
    }

    changeValues(changes, options = {}) {
      invariant(Array.isArray(changes),
        'Changes must be an array of path-value pairs'
      );

      if (options.validate) {

        const valuePaths = function(){
          if (options.validate === true) {
            return map(changes, ([valuePath]) => valuePath);
          } else {
            return arrayFrom(options.validate);
          }
        }();

        const nextState = this._newState({ valuePaths, changes });

        this._validate(nextState, options.callback || emptyFunc);

      } else {
        const nextState = this._newState({ changes });

        this.setState(nextState);
      }

    }

    _newState({ valuePaths, changes }) {
      const { touchedValues, values } = this.state;

      const newValues = function(){
        if (changes) {
          const previousValues = deepClone(values);

          each(changes, ([path, value]) => {
            set(previousValues, path, value);
          });

          return previousValues;

        } else {

          return { ...values };

        }
      }();

      const newTouchedValues = function(){
        if (valuePaths) {
          const valuePathsList = arrayFrom(valuePaths);

          return mergeTouchedValues(valuePathsList, touchedValues);
        } else {
          return touchedValues;
        }
      }();

      return {
        ...this.state,
        values: newValues,
        touchedValues: newTouchedValues
      };
    }

    validateAllHandler(validateAllValues = true, callback = emptyFunc) {

      return () => {
        this.validateAll(validateAllValues, callback);
      };

    }

    validateAll(validateAllValues = true, callback) {
      this._validate({ ...this.state, validateAllValues }, callback);
    }

    validateHandler(valuePaths, callback = emptyFunc()) {

      return () => {
        this.validate(valuePaths, callback)
      }

    }

    validate(valuePaths, afterValidationCallback = emptyFunc) {
      this._validate(this._newState({ valuePaths }), afterValidationCallback);
    }


    _validate(nextState, afterValidationCallback) {
      const afterValidationHandler =
        this._afterValidationHandler(nextState, afterValidationCallback);

      const valuesWithDefaults = unwrapObject(this._valuesWithDefaults(nextState));

      if (joiSchema) {
        Joi.validate(valuesWithDefaults, joiSchema, { abortEarly: false, ...joiOptions }, (joiError) => {
          const joiErrorList = (joiError && joiError.details) || [];

          const errors = reduce(joiErrorList, (joiErrors, { message, path }) => {
            const messageWithFieldNameRemoved = message.replace(/^\".+\" /, '');

            set(joiErrors, path, messageWithFieldNameRemoved);

            return joiErrors;
          }, {});

          this._callValidatorIfDefined(arrayFrom(validator), {
            ...nextState,
            errors,
            valuesWithDefaults
          }, afterValidationHandler);
        })

      } else {
        this._callValidatorIfDefined(arrayFrom(validator), {
          ...nextState,
          errors: {},
          valuesWithDefaults
        }, afterValidationHandler);
      }

    }

    _callValidatorIfDefined(validatorList, { values, errors, touchedValues, valuesWithDefaults, validateAllValues }, afterValidatorHasRun) {

      if (validatorList) {
        const callback = function(){
          if (validatorList.length > 1) {

            return ({ values: nextValues, errors: nextErrors }) => {

              this._callValidatorIfDefined(
                drop(validatorList), {
                  values: nextValues, errors: nextErrors,
                  touchedValues, valuesWithDefaults, validateAllValues
                }, afterValidatorHasRun
              );
            };

          } else {
            return afterValidatorHasRun;
          }
        }();

        validatorList[0]({
          valuePaths: pickOutermost(touchedValues),
          valuesWithDefaults, validateAllValues,
          values, errors, props: { ...this.props }
        }, callback);

      } else {
        afterValidatorHasRun({ values, errors });
      }
    }

    _afterValidationHandler(nextState, afterValidationComplete) {
      return ({ errors, values })=>{

        const newState = {
          ...nextState, errors, values
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
