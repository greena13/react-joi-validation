'use strict';

import React, { PropTypes, Component } from 'react';

import set from 'lodash.set';
import get from 'lodash.get';

import has from 'lodash.has';
import includes from 'lodash.includes';
import without from 'lodash.without';
import keys from 'lodash.keys';
import unique from 'lodash.uniq';

import isUndefined from 'lodash.isundefined';
import isPlainObject from 'lodash.isplainobject';
import isString from 'lodash.isstring';

import reduce from 'lodash.reduce';
import map from 'lodash.map';
import defaultsDeep from 'lodash.defaultsdeep';
import deepClone from 'lodash.clonedeep';

import emptyFunc from './utils/emptyFunc';
import arrayFrom from './utils/arrayFrom';
import pickDeep from './utils/pickDeep';
import pickOutermost from './utils/pickOutermost';
import extendAnyTouchedAncestors from './utils/extendAnyTouchedAncestors';

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

function valueAtPathHasBeenTouched(value) {
  return isString(value) || value && value[ALL_PATHS_SYMBOL];
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

      if (!valuePath.endsWith(ALL_PATHS_SYMBOL)) {
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

        const values = this._defaultsWithExemptions({
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

        return this._defaultsWithExemptions({
          defaultValue: propsWithDefaults,
          overrides: this.state.values,
          deepMergeExemptions: touchedValues
        });
      }

    }

    _defaultsWithExemptions({ deepMergeExemptions = {}, overrides, defaultValue }) {
      if (valueAtPathHasBeenTouched(deepMergeExemptions) || isUndefined(defaultValue)) {

        return overrides;

      } else {
        if (isUndefined(overrides)) {

          return defaultValue;

        } else {

          if (isPlainObject(overrides)) {

            const unionOfObjectKeys = unique([
              ...keys(defaultValue),
              ...keys(overrides)
            ]);

            return reduce(unionOfObjectKeys, (memo, key) => {
              if (valueAtPathHasBeenTouched(deepMergeExemptions[key])) {
                memo[key] = overrides[key];
              } else {
                memo[key] = this._defaultsWithExemptions({
                  defaultValue: defaultValue[key],
                  overrides: overrides[key],
                  deepMergeExemptions: deepMergeExemptions[key]
                });
              }

              return memo;

            }, {});

          } else if (Array.isArray(overrides)) {

            const overridesIsLongerThanDefault =
              overrides.length > defaultValue.length;

            if (overridesIsLongerThanDefault) {
              return map(overrides, (overrideElement, index) => {

                if (valueAtPathHasBeenTouched(deepMergeExemptions[index])) {
                  return overrideElement;
                } else {
                  return this._defaultsWithExemptions({
                    defaultValue: defaultValue[index],
                    overrides: overrideElement,
                    deepMergeExemptions: deepMergeExemptions[index]
                  });
                }

              });

            } else {
              return map(defaultValue, (defaultValueElement, index) => {

                if (valueAtPathHasBeenTouched(deepMergeExemptions[index])) {
                  return overrides[index];
                } else {
                  return this._defaultsWithExemptions({
                    defaultValue: defaultValueElement,
                    overrides: overrides[index],
                    deepMergeExemptions: deepMergeExemptions[index]
                  });
                }

              });
            }

          } else {

            return overrides;

          }
        }

      }
    }

    changeHandler(valuePath, options = {}) {
      return (event, value) => {
        const valueToUse = has(options, 'value') ? options.value : value;
        this.handleChange(valuePath, valueToUse, options);
      };

    }

    handleChange(valuePath, value, options = {}){
      const { values } = this.state;

      const newValues = deepClone(values);

      set(newValues, scopedPath(valuePath), value);

      this.setState({
        values: newValues,
        touchedValues: this._mergeTouchedValues([valuePath])
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

          this._passToValidatorFunction(
            valuePathsAsList,
            valuesToValidate,
            errorObject,
            afterValidationHandler
          );
        })

      } else {

        this._passToValidatorFunction(
          valuePathsAsList,
          valuesToValidate,
          {},
          afterValidationHandler
        )

      }
    }

    _passToValidatorFunction(valuePaths, values, errors, afterValidatorHasRun) {

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

          extendAnyTouchedAncestors(newTouchedValues, effectivePath, ALL_PATHS_SYMBOL);

          set(newTouchedValues, effectivePath, effectivePath);
        }

        return newTouchedValues;
      }, deepClone(touchedValues));
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
