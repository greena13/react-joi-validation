'use strict';

import React, { PropTypes, Component } from 'react';

import set from 'lodash.set';
import keys from 'lodash.keys';
import reduce from 'lodash.reduce';
import defaultsDeep from 'lodash.defaultsdeep';
import includes from 'lodash.includes';
import without from 'lodash.without';

import isString from 'lodash.isstring';

import emptyFunc from './utils/emptyFunc';
import arrayFrom from './utils/arrayFrom';
import pickDeep from './utils/pickDeep';
import joiPickDeep from './utils/joiPickDeep';

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

  function joiSchemaToUse(valuePaths) {
    if (includesAllValues(valuePaths)) {
      return joiSchema;
    } else {
      return joiPickDeep(Joi, joiSchema, valuePaths);
    }
  }

  function scopedPath(valuePath) {
    if (usingSingularValidationScope() && !includesAllValues(valuePath)) {
      return `${only}.${valuePath}`;
    } else {
      return valuePath;
    }
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
      const { errors } = this.state;

      return(
        <ValidatedComponent
          { ...this.props }
          { ...this._valuesWithDefaults() }

          errors={ errors }

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

        const unscopedValues = defaultsDeep({},
          this.state.values,
          propValues,
          defaultValues
        );

        if (scope && usingSingularValidationScope()) {
          return unscopedValues[only];
        } else {
          return unscopedValues;
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
        this.handleChange(valuePath, options.value || value);

        if (options.validate) {
          this.validate(valuePath)
        }
      };

    }

    handleChange(valuePath, value){
      const { values, touchedValues } = this.state;

      this.setState({
        values: set({ ...values }, scopedPath(valuePath), value),
        touchedValues: { ...touchedValues, [valuePath]: true }
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
      const valuePathsWithPrevTouched = this._valuePathsWithTouchedFields(valuePathsAsList);
      const afterValidationHandler = this._afterValidationHandler(valuePathsWithPrevTouched, afterValidationCallback);

      const valuesToValidate = this._getScopedValues(valuePathsWithPrevTouched);

      if (joiSchema) {
        Joi.validate(valuesToValidate, joiSchemaToUse(valuePathsWithPrevTouched), { abortEarly: false, ...joiOptions }, (joiError) => {
          const joiErrorList = (joiError && joiError.details) || [];

          const errorObject = reduce(joiErrorList, (errors, { message, path }) => {
            const messageWithFieldNameRemoved = message.replace(/^\".+\" /, '');

            set(errors, path, messageWithFieldNameRemoved);

            return errors;
          }, {});

          this._passToValidatorIfValidatingAll(
            valuePathsWithPrevTouched,
            valuesToValidate,
            errorObject,
            afterValidationHandler
          );
        })

      } else {

        this._passToValidatorIfValidatingAll(
          valuePathsWithPrevTouched,
          valuesToValidate,
          {},
          afterValidationHandler
        )

      }
    }

    _valuePathsWithTouchedFields(valuePaths) {
      const { validateAllValues, touchedValues } = this.state;

      if (includesAllValues(valuePaths) || validateAllValues) {
        return [ ALL_PATHS_SYMBOL ];
      } else {

        const valuePathsIndexByName = reduce(valuePaths, (memo, valuePath) => {
          memo[valuePath] = true;
          return memo;
        }, {});

        return keys({ ...touchedValues, ...valuePathsIndexByName });
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
        const { touchedValues, validateAllValues } = this.state;

        const newTouchedValues = function(){

          if (includesAllValues(valuePaths)) {
            return touchedValues;
          } else {
            const newTouchedValues = reduce(valuePaths, (memo, valuePath) => {
              memo[valuePath] = true;
              return memo;
            }, {});

            return { ...touchedValues, ...newTouchedValues };
          }
        }();

        const newValues = function(){
          if (usingSingularValidationScope()) {
            return {
              [only]: values
            };
          } else {
            return values;
          }
        }();

        const newState = {
          values: newValues, errors,
          touchedValues: newTouchedValues,
          validateAllValues: validateAllValues || includesAllValues(valuePaths)
        };

        this.setState(newState, afterValidationComplete);
      };
    }

    _getScopedValues(valuePaths) {
      const values = this._valuesWithDefaults({ scope: true });

      if (includesAllValues(valuePaths)) {
        return values;
      } else {
        return pickDeep(values, valuePaths);
      }
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
