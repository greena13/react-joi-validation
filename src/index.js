'use strict';

import React, { PropTypes, Component } from 'react';

import set from 'lodash.set';
import get from 'lodash.get';
import drop from 'lodash.drop';

import has from 'lodash.has';
import isString from 'lodash.isstring';
import isPlainObject from 'lodash.isplainobject';

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
  validatedValues: {},
  changingValues: [],

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
        const error = get(errors, valuePath);

        if (error) {
          set(activeErrors, valuePath, error);
        }
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
      this.clearTouchedValues = this.clearTouchedValues.bind(this);

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
          clearValidationTouchedValues={ this.clearTouchedValues }
        />
      );
    }

    omitDeep(target, valueToOmit){

      if (valueToOmit) {
        if (isPlainObject(target)) {

          return reduce(target, (memo, value, key) => {

            if (!isString(valueToOmit[key])) {
              memo[key] = this.omitDeep(value, valueToOmit[key]);
            }

            return memo;
          }, {});

        } else if (Array.isArray(target)) {

          return reduce(target, (memo, value, index) => {

            if (!isString(valueToOmit[index])) {
              memo.push(this.omitDeep(value, valueToOmit[index]));
            }

            return memo;
          }, []);

        } else {
          return target;
        }

      } else {
        return target;
      }
    }


    _getActiveErrors(){
      const { errors, validateAllValues, touchedValues, validatedValues } = this.state;

      const baseErrors = this.omitDeep(this.props.errors || {}, touchedValues);

      if (validateAllValues) {
        return defaultsDeep({}, errors, baseErrors);
      } else {
        return defaultsDeep(pickErrors(errors, validatedValues), baseErrors);
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

    clearTouchedValues(){
      this.setState({
        touchedValues: {},
        validateAll: false
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

        const validatePaths = function(){
          if (options.validate === true) {
            return map(changes, ([valuePath]) => valuePath);
          } else {
            return arrayFrom(options.validate);
          }
        }();

        const nextState = this._newState({ validatePaths, changes });

        this._validate(nextState, options.callback || emptyFunc);

      } else {
        const nextState = this._newState({ changes });

        this.setState(nextState);
      }

    }

    _newState({ validatePaths, changes }) {
      const { validatedValues, touchedValues, values } = this.state;

      const newValues = deepClone(values);
      const newTouchedValues = deepClone(touchedValues);
      const changingValues = [];

      if (changes) {
        each(changes, ([path, value]) => {
          set(newValues, path, value);
          set(newTouchedValues, path, path);
          changingValues.push(path);
        });
      }

      const newValidatedValues = function(){
        if (validatePaths) {
          const valuePathsList = arrayFrom(validatePaths);

          return mergeTouchedValues(valuePathsList, validatedValues);
        } else {
          return validatedValues;
        }
      }();

      return {
        ...this.state,
        values: newValues,
        touchedValues: newTouchedValues,
        validatedValues: newValidatedValues,
        changingValues
      };
    }

    validateAllHandler(callback = emptyFunc) {

      return () => {
        this.validateAll(callback);
      };

    }

    validateAll(callback) {
      this._validate({ ...this.state, validateAllValues: true }, callback);
    }

    validateHandler(validatePaths, callback = emptyFunc()) {

      return () => {
        this.validate(validatePaths, callback)
      }

    }

    validate(validatePaths, afterValidationCallback = emptyFunc) {
      this._validate(this._newState({ validatePaths }), afterValidationCallback);
    }


    _validate(nextState, afterValidationCallback) {
      const afterValidationHandler =
        this._afterValidationHandler(nextState, afterValidationCallback);

      const valuesWithDefaults = unwrapObject(this._valuesWithDefaults(nextState));

      const validatorOptions = {
        ...nextState,
        valuesWithDefaults,
        touchedValues: pickOutermost(nextState.touchedValues),
        validatedValues: pickOutermost(nextState.validatedValues),
        props: { ...this.props }
      };

      if (joiSchema) {
        Joi.validate(valuesWithDefaults, joiSchema, { abortEarly: false, ...joiOptions }, (joiError) => {
          const joiErrorList = (joiError && joiError.details) || [];

          const errors = reduce(joiErrorList, (joiErrors, { message, path }) => {
            const messageWithFieldNameRemoved = message.replace(/^\".+\" /, '');

            set(joiErrors, path, messageWithFieldNameRemoved);

            return joiErrors;
          }, {});

          this._callValidatorIfDefined(arrayFrom(validator), {
            ...validatorOptions, errors
          }, afterValidationHandler);
        })

      } else {
        this._callValidatorIfDefined(arrayFrom(validator), {
          ...validatorOptions, errors: {}
        }, afterValidationHandler);
      }

    }

    _callValidatorIfDefined(validatorList, validatorOptions, afterValidatorHasRun) {

      if (validatorList.length > 0) {
        const callback = function(){
          if (validatorList.length > 1) {

            return ({ values, errors }) => {

              this._callValidatorIfDefined(
                drop(validatorList), {
                  ...validatorOptions, values, errors
                }, afterValidatorHasRun
              );
            };

          } else {
            return afterValidatorHasRun;
          }
        }();

        validatorList[0](validatorOptions, callback);

      } else {
        const { values, errors } = validatorOptions;

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
