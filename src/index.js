import React, { Component } from 'react';

import set from 'lodash.set';
import unset from 'lodash.unset';
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
import mergeValidatedValuePaths from './utils/mergeValidatedValuePaths';
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

/**
 * Takes arguments that resemble those commonly passed to event handlers and attempts
 * to guess what the desired event value should be. This function is the default used
 * by all *Handler methods to extract values from events so that they can be set and
 * validated.
 * @param {*} event The first argument, assumed to be an event object but does not need
*         to be.
 * @param {*} value The second argument, assumed to be the value of the event, but
 *        does not need to be.
 * @returns {*} The assumed event value
 */
export function guessCorrectValue(event, value) {

  /**
   * Inspect the callback arguments when the handler is called
   */
  const eventTargetValue = get(event, 'target.value');

  if (eventTargetValue) {
    // Use value from event object
    return eventTargetValue;
  } else {
    // Use value provided as second argument
    return value;
  }
}

/**
 * Returns the target value of an event that is passed to it
 * @param {Event} event Event object for which the target value will be returned
 * @returns {*} The target value of the event passed as the first argument
 */
export function useEventTargetValue(event) {
  return get(event, 'target.value');
}

/**
 * Returns the first argument. Used for adapting event handlers that return the event
 * value as the first argument.
 * @param {*} value First argument
 * @returns {*} The value of the first argument
 */
export function useFirstArgument(value) {
  return value;
}

/**
 * Returns the second argument. Used for adapting event handlers that return the event
 * value as the second argument.
 * @param {*} arg1 The first argument
 * @param {*} value Second argument
 * @returns {*} The value of the second argument
 */
export function useSecondArgument(arg1, value) {
  return value;
}

/**
 * Returns the third argument. Used for adapting event handlers that return the event
 * value as the third argument.
 * @param {*} arg1 The first argument
 * @param {*} arg2 The second argument
 * @param {*} value Third argument
 * @returns {*} The value of the third argument
 */
export function useThirdArgument(arg1, arg2, value) {
  return value;
}

let defaultChangeHandlerStrategy = guessCorrectValue;

/**
 * Returns a validator component that wraps a validated component and provides
 * methods for updating and validating the validator component's state via the
 * validated component's props
 *
 * @param {Component} ValidatedComponent Component to wrap and provide the methods
 *        for updating and validating values as props
 * @param {Object.<String,*>} options A configuration hash
 * @param {Joi|Object?} options.joiSchema A Joi schema that, if provided, is used
 *        to validate the values stored in the validator component's state every time
 *        one of the validation methods are called.
 * @param {Object?} options.joiOptions Options that are passed to Joi on every
 *        validation attempt. See the documentation for the version of Joi that you
 *        are using.
 * @param {Function|Array.<Function>?} options.validator A function or array of
 *        functions to use to validate the values stored in the validator component's
 *        state every time one of the validate methods are called. Can be used in
 *        conjunction with the joiSchema option, or without it. If both are specified,
 *        the joiSchema validation is performed first and then the validators are
 *        called in the order that they appear in the array.
 * @param {String|Array.<String>?} options.only Path or paths to the part of the props
 *        object passed to the validator (and passed through to the validated
 *        object) that should be validated against the joi schema. Useful if you
 *        want to validate only part of the props.
 * @param {String|Array.<String>?} pseudoValues List of paths to values that aren't
 *        actually in the props passed to the validator component and are never set
 *        by the validated component, but are accessible to attach validation errors
 *        to, in validator functions.
 * @param {String="errors"} externalErrorsPath Path to the attribute on props that
 *        stores the errors object of any validation performed outside of the
 *        validator component. These errors are merged into those set by the validator
 *        component.
 * @param {Function?} changeHandlerStrategy The default change handler strategy to
 *        use in the validator component. i.e. The default function that should be used
 *        to map the arguments of event handlers to the validation handlers', provided
 *        by the validator component. If unspecified, the default set at the package
 *        level using setChangeHandlerStrategy() is used, or the guessCorrectValue
 *        function if none has been otherwise specified.
 * @returns {ValidatorComponent} The validator component, that wrapping the validated
 *        component.
 */

const ReactJoiValidation = (ValidatedComponent, { joiSchema, joiOptions, validator, only, pseudoValues = [], externalErrorsPath, changeHandlerStrategy }) => {
  function usingSingularValidationScope(){
    return isString(only);
  }

  function wrapObject(object){
    if (usingSingularValidationScope()) {
      return set({}, only, object);
    } else {
      return object;
    }
  }

  function unwrapObject(object){
    if (usingSingularValidationScope()) {
      return get(object, only);
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

  function getValueToUse(options, firstArg, secondArg, thirdArg) {
    if (has(options, 'value')) {

      /**
       * Allow setting a fixed value at the time of binding the change
       * handler and ignore whatever value is passed when the handler
       * is called
       */
      return options.value;
    } else {
      return (options.strategy || changeHandlerStrategy || defaultChangeHandlerStrategy)(firstArg, secondArg, thirdArg);
    }
  }

  /**
   * @class ValidatorComponent Component class that renders its children with props
   * that contain functions for updating and validating the values stored in the
   * validator component's state.
   */

  class ValidatorComponent extends Component {

    /**
     * Creates a new instance of a ValidatorComponent, binds all validation and
     * update methods to that instance, and sets its default state.
     *
     * @param {Object.<*,*>} props Props that are passed through this
     *        component to the validated component. All or part of these values
     *        determine the initial values in the component's state, depending
     *        on ReactJoiValidation's only option.
     * @param {Object.<*,*>} context Context object for this component and the
     *        validated component
     *
     * @see ReactJoiValidation
     */
    constructor(props, context) {
      super(props, context);

      this.changeHandler = this.changeHandler.bind(this);
      this.changesHandler = this.changesHandler.bind(this);
      this.changeValue = this.changeValue.bind(this);
      this.changeValues = this.changeValues.bind(this);

      this.pushHandler = this.pushHandler.bind(this);
      this.pushValue = this.pushValue.bind(this);
      this.togglePushHandler = this.togglePushHandler.bind(this);
      this.togglePushValue = this.togglePushValue.bind(this);

      this.unshiftHandler = this.unshiftHandler.bind(this);
      this.unshiftValue = this.unshiftValue.bind(this);
      this.toggleUnshiftHandler = this.toggleUnshiftHandler.bind(this);
      this.toggleUnshiftValue = this.toggleUnshiftValue.bind(this);

      this.pullHandler = this.pullHandler.bind(this);
      this.pullValue = this.pullValue.bind(this);

      this.validateHandler = this.validateHandler.bind(this);
      this.validate = this.validate.bind(this);

      this.validateAll = this.validateAll.bind(this);
      this.validateAllHandler = this.validateAllHandler.bind(this);

      this.clearValidation = this.clearValidation.bind(this);
      this.clearValidationState = this.clearValidationState.bind(this);
      this.clearValidationAndResetValues = this.clearValidationAndResetValues.bind(this);
      this.clearTouchedValues = this.clearTouchedValues.bind(this);

      this.state = { ...DEFAULT_STATE };
    }

    /**
     * Renders the validated component with all of the functions for updating and
     * validating the validator component's state, as props. All props passed to the
     * validator component are also passed through to the validated component.
     *
     * @returns {Component} The validated component, with the update and validation
     *          props provided
     */
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

          pushHandler={ this.pushHandler }
          pushValue={ this.pushValue }
          togglePushHandler={ this.togglePushHandler }
          togglePushValue={ this.togglePushValue }

          unshiftHandler={ this.unshiftHandler }
          unshiftValue={ this.unshiftValue }
          toggleUnshiftHandler={ this.toggleUnshiftHandler }
          toggleUnshiftValue={ this.toggleUnshiftValue }

          pullHandler={ this.pullHandler }
          pullValue={ this.pullValue }

          validateHandler={ this.validateHandler }
          validate={ this.validate }

          validateAllHandler={ this.validateAllHandler }
          validateAll={ this.validateAll }

          clearValidationState={ this.clearValidationState }
          clearValidation={ this.clearValidation }
          clearValidationAndResetValues={ this.clearValidationAndResetValues }
          clearValidationTouchedValues={ this.clearTouchedValues }
        />
      );
    }

    /**
     * Returns a function that, when called, pushes a value onto the end of an array
     * stored in the validator component's state
     *
     * @param {String} valuePath A path pointing to the array value, for which the
     *        function should push new values onto.
     * @param {Object<String,*>?} options A hash of options that configure how the
     *        returned function behaves.
     * @param {Boolean=true} options.allowDuplicates Whether or not to push a value
     *        onto the array if it already appears in that array.
     * @param {*?} options.value The value to push onto the array when the function
     *        is called. If not provided, the value will be determined by the
     *        arguments passed to the function when it is called.
     * @param {Function=guessCorrectValue} options.strategy A function that takes
     *        the arguments passed to the function returned by this method, and returns
     *        which one should be used as the new value. Useful for standardising
     *        different event handler argument signatures. The package exports some
     *        common strategy functions for you to use, but it is possible to use
     *        any arbitrary function you like.
     * @param {Boolean|String|Array.<String>?} options.validate Whether to validate
     *        the value once it has been set. If true, then the value is validated
     *        after it has been set. If set to a string, the value at the path pointed
     *        to by the string is validated instead of the value being set. If set
     *        to an array of strings, each of the values pointed to by the path in
     *        each string is validated instead of the value being set.
     * @param {Function?} options.callback A function to call once the value has been
     *        set and any validation has been completed.
     * @returns {function(*=, *=, *=)} Function that when called, will update the array
     *        at valuePath, according to the options provided
     *
     * @example
     * render() {
     *   const { pushHandler, cities } = this.props;
     *
     *   return(
     *     ["Paris", "New York City", "London"].map((city) => {
     *       return(
     *         <input type='button' label={ "Add " + city } onClick={ pushHandler('cities') } />
     *       );
     *     }
     *   );
     * }
     *
     */

    pushHandler(valuePath, options = {}) {
      return (firstArg, secondArg, thirdArg) => {
        this.pushValue(valuePath, getValueToUse(options, firstArg, secondArg, thirdArg), options);
      }
    }

    /**
     * Immediately pushes a value onto the end of an array
     *
     * @param {String} valuePath A path pointing to the array value, for which the
     *        function should push new values onto.
     * @param {*} value The value to push onto the end of the array
     * @param {Object<String,*>?} options A hash of configuration options
     * @param {Boolean=true} options.allowDuplicates Whether or not to push a value
     *        onto the array if it already appears in that array.
     * @param {Boolean|String|Array.<String>?} options.validate Whether to validate
     *        the value once it has been set. If true, then the value is validated
     *        after it has been set. If set to a string, the value at the path pointed
     *        to by the string is validated instead of the value being set. If set
     *        to an array of strings, each of the values pointed to by the path in
     *        each string is validated instead of the value being set.
     * @param {Function?} options.callback A function to call once the value has been
     *        set and any validation has been completed.
     *
     * @example
     * handleAddCity(city) {
     *    const { pushValue, cities } = this.props;
     *
     *    if (cities.indexOf(city) === -1 ) {
     *       pushValue('cities', city);
     *    }
     * }
     *
     */

    pushValue(valuePath, value, options = {}) {
      this._addValue('end', valuePath, value, options);
    }

    /**
     * Returns a function that, when called, pushes a value onto the end of an array
     * if that value is not already in the array, otherwise it removes it. i.e. it
     * toggles that value's inclusion in the array.
     *
     * @param {String} valuePath A path pointing to the array value, for which the
     *        function should push new values onto.
     * @param {Object<String,*>?} options A hash of options that configure how the
     *        returned function behaves.
     * @param {*?} options.value The value to toggle in the array when the function
     *        is called. If not provided, the value will be determined by the
     *        arguments passed to the function when it is called.
     * @param {Function=guessCorrectValue} options.strategy A function that takes
     *        the arguments passed to the function returned by this method, and returns
     *        which one should be used as the new value. Useful for standardising
     *        different event handler argument signatures. The package exports some
     *        common strategy functions for you to use, but it is possible to use
     *        any arbitrary function you like.
     * @param {Boolean|String|Array.<String>?} options.validate Whether to validate
     *        the value once it has been set. If true, then the value is validated
     *        after it has been set. If set to a string, the value at the path pointed
     *        to by the string is validated instead of the value being set. If set
     *        to an array of strings, each of the values pointed to by the path in
     *        each string is validated instead of the value being set.
     * @param {Function?} options.callback A function to call once the value has been
     *        set and any validation has been completed.
     * @returns {function(*=, *=, *=)} Function that when called, will toggle the
     *        inclusion or exclusion of a value in the array at at valuePath
     *
     * @example
     * render() {
     *   const { togglePushHandler, cities } = this.props;
     *
     *   return(
     *     ["Paris", "New York City", "London"].map((city) => {
     *       return(
     *         <label>
     *            <input type='checkbox' onClick={ togglePushHandler('cities') } />
     *            { city }
     *         </label>
     *       );
     *     }
     *   );
     * }
     *
     */

    togglePushHandler(valuePath, options = {}) {
      return (firstArg, secondArg, thirdArg) => {
        this.togglePushValue(valuePath, getValueToUse(options, firstArg, secondArg, thirdArg), options);
      }
    }

    /**
     * Immediately pushes a value onto the end of an array if that value is not
     * already in the array, otherwise it removes it. i.e. it toggles that value's
     * inclusion in the array.
     *
     * @param {String} valuePath A path pointing to the array value, for which the
     *        function should toggle the value.
     * @param {*} value The value to toggle the inclusion or exclusion in array
     * @param {Object<String,*>?} options A hash of configuration options
     * @param {Boolean|String|Array.<String>?} options.validate Whether to validate
     *        the value once it has been set. If true, then the value is validated
     *        after it has been set. If set to a string, the value at the path pointed
     *        to by the string is validated instead of the value being set. If set
     *        to an array of strings, each of the values pointed to by the path in
     *        each string is validated instead of the value being set.
     * @param {Function?} options.callback A function to call once the value has been
     *        set and any validation has been completed.
     *
     * @example
     * render() {
     *   return(
     *     ["Paris", "New York City", "London"].map((city) => {
     *       return(
     *         <label>
     *             <input type='checkbox' onClick={ this.handleToggleCity('cities') } />
     *             { city }
     *         </label>
     *       );
     *     }
     *   );
     * }
     *
     * handleToggleCity(city) {
     *   const { togglePushHandler, cities } = this.props;
     *
     *   togglePushHandler('cities', city);
     * }
     *
     */

    togglePushValue(valuePath, value, options = {}) {
      const currentValue = this._getCurrentValue(valuePath) || [];

      if (currentValue.indexOf(value) === -1) {
        this._addValue('end', valuePath, value, { ...options, allowDuplicates: false });
      } else {
        this.pullValue(valuePath, value, { ...options, removeAllInstances: true });
      }
    }

    /**
     * Similar to pushValueHandler, but the returned function, when called,
     * adds a value to the beginning of an array, instead
     *
     * @param {String} valuePath A path pointing to the array value, for which the
     *        function should add a value to the beginning
     * @param {Object<String,*>?} options A hash of options that configure how the
     *        returned function behaves.
     * @param {Boolean=true} options.allowDuplicates Whether or not to unshift a value
     *        onto the array if it already appears in that array.
     * @param {*?} options.value The value to unshift onto the array when the function
     *        is called. If not provided, the value will be determined by the
     *        arguments passed to the function when it is called.
     * @param {Function=guessCorrectValue} options.strategy A function that takes
     *        the arguments passed to the function returned by this method, and returns
     *        which one should be used as the new value. Useful for standardising
     *        different event handler argument signatures. The package exports some
     *        common strategy functions for you to use, but it is possible to use
     *        any arbitrary function you like.
     * @param {Boolean|String|Array.<String>?} options.validate Whether to validate
     *        the value once it has been set. If true, then the value is validated
     *        after it has been set. If set to a string, the value at the path pointed
     *        to by the string is validated instead of the value being set. If set
     *        to an array of strings, each of the values pointed to by the path in
     *        each string is validated instead of the value being set.
     * @param {Function?} options.callback A function to call once the value has been
     *        set and any validation has been completed.
     * @returns {function(*=, *=, *=)} Function that when called, will update the array
     *        at valuePath, according to the options provided
     *
     * @see pushValueHandler
     */

    unshiftHandler(valuePath, options = {}) {
      return (firstArg, secondArg, thirdArg) => {
        this.unshiftValue(valuePath, getValueToUse(options, firstArg, secondArg, thirdArg), options);
      }
    }

    /**
     * Similar to pushValue, but immediately adds a value to the beginning of an array
     * instead
     *
     * @param {String} valuePath A path pointing to the array value, for which the
     *        function should add a new values to the beginning.
     * @param {*} value The value to add to the start of the array
     * @param {Object<String,*>?} options A hash of configuration options
     * @param {Boolean=true} options.allowDuplicates Whether or not to unshift a value
     *        onto the array if it already appears in that array.
     * @param {Boolean|String|Array.<String>?} options.validate Whether to validate
     *        the value once it has been set. If true, then the value is validated
     *        after it has been set. If set to a string, the value at the path pointed
     *        to by the string is validated instead of the value being set. If set
     *        to an array of strings, each of the values pointed to by the path in
     *        each string is validated instead of the value being set.
     * @param {Function?} options.callback A function to call once the value has been
     *        set and any validation has been completed.
     *
     * @see pushValue
     */

    unshiftValue(valuePath, value, options = {}) {
      this._addValue('start', valuePath, value, options);
    }

    /**
     * Returns a function that, when called, adds a value to the beginning of an array
     * if that value is not already in the array, otherwise it removes it. i.e. it
     * toggles that value's inclusion in the array.
     *
     * @param {String} valuePath A path pointing to the array value, for which the
     *        function should add new value to the start.
     * @param {Object<String,*>?} options A hash of options that configure how the
     *        returned function behaves.
     * @param {*?} options.value The value to toggle in the array when the function
     *        is called. If not provided, the value will be determined by the
     *        arguments passed to the function when it is called.
     * @param {Function=guessCorrectValue} options.strategy A function that takes
     *        the arguments passed to the function returned by this method, and returns
     *        which one should be used as the new value. Useful for standardising
     *        different event handler argument signatures. The package exports some
     *        common strategy functions for you to use, but it is possible to use
     *        any arbitrary function you like.
     * @param {Boolean|String|Array.<String>?} options.validate Whether to validate
     *        the value once it has been set. If true, then the value is validated
     *        after it has been set. If set to a string, the value at the path pointed
     *        to by the string is validated instead of the value being set. If set
     *        to an array of strings, each of the values pointed to by the path in
     *        each string is validated instead of the value being set.
     * @param {Function?} options.callback A function to call once the value has been
     *        set and any validation has been completed.
     * @returns {function(*=, *=, *=)} Function that when called, will toggle the
     *        inclusion or exclusion of a value in the array at at valuePath
     *
     * @see togglePushHandler
     */

    toggleUnshiftHandler(valuePath, options = {}) {
      return (firstArg, secondArg, thirdArg) => {
        this.toggleUnshiftValue(valuePath, getValueToUse(options, firstArg, secondArg, thirdArg), options);
      }
    }

    /**
     * Immediately pushes a value to the beginning of an array if that value is not
     * already in the array, otherwise it removes it. i.e. it toggles that value's
     * inclusion in the array.
     *
     * @param {String} valuePath A path pointing to the array value, for which the
     *        function should toggle the value.
     * @param {*} value The value to toggle the inclusion or exclusion in array
     * @param {Object<String,*>?} options A hash of configuration options
     * @param {Boolean|String|Array.<String>?} options.validate Whether to validate
     *        the value once it has been set. If true, then the value is validated
     *        after it has been set. If set to a string, the value at the path pointed
     *        to by the string is validated instead of the value being set. If set
     *        to an array of strings, each of the values pointed to by the path in
     *        each string is validated instead of the value being set.
     * @param {Function?} options.callback A function to call once the value has been
     *        set and any validation has been completed.
     *
     * @see togglePushValue
     */

    toggleUnshiftValue(valuePath, value, options = {}) {
      const currentValue = this._getCurrentValue(valuePath) || [];

      if (currentValue.indexOf(value) === -1) {
        this._addValue('start', valuePath, value, { ...options, allowDuplicates: false });
      } else {
        this.pullValue(valuePath, value, { ...options, removeAllInstances: true });
      }
    }

    /**
     * The opposite of pushHandler and unshiftHandler; returns a function that,
     * when called, will remove one or more instances of a value from an array.
     *
     * The default behaviour is to remove only the first instance of the specified
     * value from the array. i.e. the instance of the value with the lowest index.
     *
     * @param {String} valuePath A path pointing to the array value, for which the
     *        function should remove the value.
     * @param {Object<String,*>?} options A hash of configuration options
     * @param {*?} options.value The value to remove from the array when the function
     *        is called. If not provided, the value will be determined by the
     *        arguments passed to the function when it is called.
     * @param {Number} options.index If specified, the element at the corresponding
     *        index position will be removed, regardless of the value passed to the
     *        function.
     * @param {Boolean=false} options.removeAllInstances If true, all instances of
     *        the specified value are removed from the array - not just the first one.
     * @param {Function=guessCorrectValue} options.strategy A function that takes
     *        the arguments passed to the function returned by this method, and returns
     *        which one should be used the value to remove from the array. Useful
     *        for standardising different event handler argument signatures. The
     *        package exports some common strategy functions for you to use, but
     *        it is possible to use any arbitrary function you like.
     * @param {Boolean|String|Array.<String>?} options.validate Whether to validate
     *        the value once it has been set. If true, then the value is validated
     *        after it has been set. If set to a string, the value at the path pointed
     *        to by the string is validated instead of the value being set. If set
     *        to an array of strings, each of the values pointed to by the path in
     *        each string is validated instead of the value being set.
     * @param {Function?} options.callback A function to call once the value has been
     *        set and any validation has been completed.
     * @returns {function(*=, *=, *=)} Function that when called, will remove the value
     *        from the array at valuePath, according to the options provide
     *
     * @example
     * render() {
     *   const { pullHandler, cities } = this.props;
     *
     *   return(
     *     cities.map((city, index) => {
     *       return(
     *         <input type='button' label={ "Remove " + city } onClick={ pullHandler('cities', { removeAllInstances: true }) } />
     *       );
     *     }
     *   );
     * }
     */

    pullHandler(valuePath, options = {}) {
      return (firstArg, secondArg, thirdArg) => {
        this.pullValue(valuePath, getValueToUse(options, firstArg, secondArg, thirdArg), options);
      }
    }

    /**
     * The opposite of pushValue and unshiftValue; immediately removes a value from
     * an array.
     *
     * The default behaviour is to remove only the first instance of the specified
     * value from the array. i.e. the instance of the value with the lowest index.
     *
     * @param {String} valuePath A path pointing to the array, from which the
     *        function should remove the specified value
     * @param {*} value The value to remove from the array
     * @param {Object<String,*>?} options A hash of configuration options
     * @param {Number} options.index If specified, the element at the corresponding
     *        index position will be removed, regardless of the value passed to the
     *        function.
     * @param {Boolean=false} options.removeAllInstances If true, all instances of
     *        the specified value are removed from the array - not just the first one.
     * @param {Boolean|String|Array.<String>?} options.validate Whether to validate
     *        the value once it has been set. If true, then the value is validated
     *        after it has been set. If set to a string, the value at the path pointed
     *        to by the string is validated instead of the value being set. If set
     *        to an array of strings, each of the values pointed to by the path in
     *        each string is validated instead of the value being set.
     *
     * @see pushValue
     *
     * @example
     * render() {
     *   const { cities } = this.props;
     *
     *   return(
     *     cities.map((city, index) => {
     *       return(
     *         <input type='button' label={ "Remove " + city } onClick={ this.handleRemoveCity } />
     *       );
     *     }
     *   );
     * }
     *
     * handleRemoveCity(city) {
     *    const { pullValue, cities, user } = this.props;
     *
     *    if (user.isAdmin) {
     *       pullValue('cities', city);
     *    }
     * }
     */

    pullValue(valuePath, value, options = {}) {
      const currentValue = this._getCurrentValue(valuePath) || [];

      const finalValue = function(){
        if (options.removeAllInstances) {
          return currentValue.reduce((memo, element) => {
            if (element !== value) {
              memo.push(element);
            }

            return memo;
          }, []);
        } else {
          invariant(!has(options, 'index') || (typeof options.index === 'number'),
            `pullValue's options.index must be a number; Received ${options.index} instead`
          );

          const index = has(options, 'index') ? options.index : currentValue.indexOf(value);

          if (index === -1) {
            return currentValue;
          } else {
            return [
              ...currentValue.slice(0, index),
              ...currentValue.slice(index + 1)
            ];
          }
        }
      }();

      this.changeValue(
        valuePath,
        finalValue,
        options
      )
    }

    /**
     * Returns a function that, when called, updates the specified attribute with
     * a new value
     *
     * @param {String} valuePath A path pointing to the attribute to update
     * @param {Object<String,*>?} options A hash of options that configure how the
     *        returned function behaves.
     * @param {*?} options.value The new value to set when the function
     *        is called. If not provided, the value will be determined by the
     *        arguments passed to the function when it is called.
     * @param {Function=guessCorrectValue} options.strategy A function that takes
     *        the arguments passed to the function returned by this method, and returns
     *        which one should be used as the new value. Useful for standardising
     *        different event handler argument signatures. The package exports some
     *        common strategy functions for you to use, but it is possible to use
     *        any arbitrary function you like.
     * @param {Boolean|String|Array.<String>?} options.validate Whether to validate
     *        the value once it has been set. If true, then the value is validated
     *        after it has been set. If set to a string, the value at the path pointed
     *        to by the string is validated instead of the value being set. If set
     *        to an array of strings, each of the values pointed to by the path in
     *        each string is validated instead of the value being set.
     * @param {Function?} options.callback A function to call once the value has been
     *        set and any validation has been completed.
     * @returns {function(*=, *=, *=)} Function that when called, will update the
     *        attribute at valuePath, according to the options provided
     *
     * @example
     * const { user: { username }, changeHandler } = this.props;
     *
     *  return(
     *    <div>
     *      <input value={username} onChange={changeHandler('username')} />
     *    </div>
     *  )
     */

    changeHandler(valuePath, options = {}) {
      return (firstArg, secondArg, thirdArg) => {
        this.changeValue(valuePath, getValueToUse(options, firstArg, secondArg, thirdArg), options);
      };
    }

    /**
     * Updates an attribute with a new value
     *
     * @param {String} valuePath A path pointing to the attribute to update
     * @param {*} value The new value to update the attribute to.
     * @param {Object<String,*>?} options A hash of configuration options
     * @param {Boolean|String|Array.<String>?} options.validate Whether to validate
     *        the value once it has been set. If true, then the value is validated
     *        after it has been set. If set to a string, the value at the path pointed
     *        to by the string is validated instead of the value being set. If set
     *        to an array of strings, each of the values pointed to by the path in
     *        each string is validated instead of the value being set.
     * @param {Function?} options.callback A function to call once the value has been
     *        set and any validation has been completed.
     *
     * @example
     * render() {
     *   const { user: { username } } = this.props;
     *
     *   return(
     *     <div>
     *       <input value={username} onChange={this.handleUsernameChange} />
     *     </div>
     *   )
     * }
     *
     * handleUsernameChange(event, newUsername){
     *   const { changeValue } = this.props;
     *
     *   // custom code here
     *   changeValue('username', newUsername)
     * }
     */

    changeValue(valuePath, value, options = {}){
      invariant(!Array.isArray(valuePath),
        'Value path passed to changeValue was an array. If you want to change multiple values at once, use `changeValues` (pluralized) instead.'
      );

      this.changeValues([[valuePath, value]], options)
    }

    /**
     * Returns a function that, when called, updates multiple attributes with new values
     *
     * @param {Array.<Array.<String|*>>} changes An array of path and new value tuples
     * @param {Object<String,*>?} options A hash of options that configure how the
     *        returned function behaves.
     * @param {Boolean|String|Array.<String>?} options.validate Whether to validate
     *        the value once it has been set. If true, then the value is validated
     *        after it has been set. If set to a string, the value at the path pointed
     *        to by the string is validated instead of the value being set. If set
     *        to an array of strings, each of the values pointed to by the path in
     *        each string is validated instead of the value being set.
     * @param {Function?} options.callback A function to call once the value has been
     *        set and any validation has been completed.
     * @returns {function(*=, *=, *=)} Function that when called, will update the
     *        attributes with the value specified in the changes list
     *
     * @example
     * return(
     *  <button onChange={changesHandler([['username', ''], ['password', '']])}   >
     *    Clear
     *  </button>
     * )
     */

    changesHandler(changes, options = {}) {
      return () => {
        this.changeValues(changes, options);
      };
    }

    /**
     * Updates multiple attributes with new values
     *
     * @param {Array.<Array.<String|*>>} changes An array of path and new value tuples
     * @param {Object<String,*>?} options A hash of configuration options
     * @param {Boolean|String|Array.<String>?} options.validate Whether to validate
     *        the value once it has been set. If true, then the value is validated
     *        after it has been set. If set to a string, the value at the path pointed
     *        to by the string is validated instead of the value being set. If set
     *        to an array of strings, each of the values pointed to by the path in
     *        each string is validated instead of the value being set.
     * @param {Function?} options.callback A function to call once the value has been
     *        set and any validation has been completed.
     *
     * @example
     * render() {
     *   return(
     *     <div>
     *       <button onChange={this.handleClearValues} >
     *         Clear
     *       </button>
     *     </div>
     *   )
     * }
     *
     * handleClearValues(event){
     *   const { changeValues } = this.props;
     *
     *   // custom code here
     *   changeValues([ ['username', ''], ['password', ''] ])
     * }
     */

    changeValues(changes, { validate = false, callback = emptyFunc } = {}) {
      invariant(Array.isArray(changes),
        'Changes must be an array of path-value pairs'
      );

      if (validate) {

        const validatePaths = function(){
          if (validate === true) {
            return map(changes, ([valuePath]) => valuePath);
          } else {
            return validate;
          }
        }();

        const nextState = this._newState({ validatePaths, changes });

        this._validate(nextState, callback);

      } else {
        const nextState = this._newState({ changes });

        this.setState(nextState);
      }

    }

    /**
     * Returns a function that, when called, validates all values currently in the
     * validation component's state (including values set by defaultProps and passed
     * in as props).
     *
     * @param {Function?} callback Function to call once the validation has been
     *        completed and any error messages set.
     * @returns {function()} Function that, when called, will validate all values
     *
     * @example
     * render() {
     *   const { user: { username }, changeHandler, validateAllHandler } = this.props;
     *
     *   return(
     *     <div>
     *       <input value={username}
     *         onChange={changeHandler('username')}
     *       />
     *
     *       <input type="submit" onClick={validateAllHandler(this.handleValidation)} />
     *     </div>
     *   )
     * }
     *
     * handleValidation(){
     *   const { errors } = this.props;
     *
     *   if (!any(errors)) {
     *     // navigate away
     *   }
     * }
     */

    validateAllHandler(callback = emptyFunc) {

      return () => {
        this.validateAll(callback);
      };

    }

    /**
     * Validates all values currently in the validation component's state
     * (including values set by defaultProps and passed in as props).
     *
     * @param {Function?} callback Function to call once the validation has been
     *        completed and any error messages set.
     *
     * @example
     * render() {
     *   const { user: { username }, changeHandler } = this.props;
     *
     *   return(
     *     <div>
     *       <input value={username}
     *         onChange={changeHandler('username')}
     *       />
     *
     *       <input type="submit" onClick={this.handleValidation} />
     *     </div>
     *   )
     * }
     *
     * handleValidation(){
     *   const { validateAll } = this.props;
     *
     *   // custom code here
     *
     *   validateAll(() => {
     *     const { errors } = this.props;
     *
     *     if (!any(errors)) {
     *       // navigate away
     *     }
     *   });
     * }
     */

    validateAll(callback) {
      this._validate({ ...this.state, validateAllValues: true }, callback);
    }

    /**
     * Returns a function that, when called, validates some of the values currently
     * in the validation component's state (including values set by defaultProps
     * and passed in as props).
     *
     * @param {String|Array.<String>} validatePaths List of paths to values that will
     *        be validated when the returned function is called
     * @param {Function?} callback Function to call once the validation has been
     *        completed and any error messages set.
     * @returns {function()} Function that, when called, will validate the specified
     *        values
     *
     * @example
     * const { address: { country, postcode }, changeHandler, validateHandler } = this.props;
     *
     *     return(
     *      <div>
     *        <input value={postcode}
     *            onChange={changeHandler('postcode')}
     *        />
     *
     *        <input value={country}
     *            onChange={changeHandler('country')}
     *            onBlur={validateHandler(['postcode','country'])}
     *        />
     *      </div>
     *     )
     */

    validateHandler(validatePaths, callback = emptyFunc()) {

      return () => {
        this.validate(validatePaths, callback)
      }

    }

    /**
     * Validates some of the values currently in the validation component's state
     * (including values set by defaultProps and passed in as props).
     *
     * @param {String|Array.<String>} validatePaths List of paths to values that will
     *        be validated when the returned function is called
     * @param {Function?} afterValidationCallback Function to call once the
     *        validation has been completed and any error messages set.
     *
     * @example
     * render() {
     *   const { user: { username }, changeHandler } = this.props;
     *
     *   return(
     *     <div>
     *       <input value={username}
     *         onChange={changeHandler('username')}
     *         onBlur={this.handleUsernameValidation}
     *       />
     *     </div>
     *   )
     * }
     *
     * handleUsernameValidation(event){
     *   const { validate } = this.props;
     *
     *   // custom code here
     *
     *   validate('username')
     * }
     */

    validate(validatePaths, afterValidationCallback = emptyFunc) {
      this._validate(this._newState({ validatePaths }), afterValidationCallback);
    }

    /**
     * Clears the validation state and resets values for some or all of the values
     * being handled by the validator component.
     *
     * @param {String|Array.<String>?} paths A path, or a list of paths for which any
     *      errors or values, should be reset to the default. If not provided, all values
     *      and errors are reset to their default.
     *
     * @deprecated since v1.2.0. Use clearValidationAndResetValues(), instead
     */

    clearValidationState(paths){
      console.warn(
        'Deprecation Warning: clearValidationState is deprecated. Please use clearValidationAndResetValues() instead.'
      );

      this.clearValidationAndResetValues(paths);
    }

    /**
     * Clears the validation state and resets values for some or all of the values
     * being handled by the validator component.
     *
     * @param {String|Array.<String>?} paths A path, or a list of paths for which any
     *      errors or values, should be reset to the default. If not provided, all values
     *      and errors are reset to their default.
     *
     * @example
     * handleValidation(){
     *   const { validateAll } = this.props;
     *
     *   // custom code here
     *
     *   validateAll(() => {
     *     const { errors, clearValidationAndResetValues } = this.props;
     *
     *     if (!any(errors)) {
     *       // send to your store or server
     *
     *       this.clearValidationAndResetValues()
     *     }
     *   });
     * }
     */

    clearValidationAndResetValues(paths) {
      if (paths) {
        const { touchedValues, validatedValues, values } = this.state;

        const pathList = arrayFrom(paths);
        const newTouchedValues = deepClone(touchedValues);
        const newValidatedValues = deepClone(validatedValues);
        const newValues = deepClone(values);

        each(pathList, (path) => {
          unset(newTouchedValues, path);
          unset(newValidatedValues, path);
          unset(newValues, path);
        });

        this.setState({
          touchedValues: newTouchedValues,
          validatedValues: newValidatedValues,
          values: newValues
        });

      } else {
        this.setState({
          ...DEFAULT_STATE
        });
      }
    }

    /**
     * Clears the validation state for some or all of the values being handled by
     * the validator component. The actual values are NOT reset.
     *
     * @param {String|Array.<String>?} paths A path, or a list of paths for which any
     *      values should be reset to the default. If not provided, all values
     *      and errors are reset to their default.
     *
     * @example
     * handleValidation() {
     *   const { clearValidation, overrideValidation } = this.props;
     *
     *   if (overrideValidation) {
     *     clearValidation(); // or clearValidation('user.username')
     *   }
     * }
     */

    clearValidation(paths){

      if (paths) {
        const { validatedValues } = this.state;
        const newValidatedValues = deepClone(validatedValues);

        const pathList = arrayFrom(paths);

        each(pathList, (path) => {
          unset(newValidatedValues, path);
        });

        this.setState({
          validatedValues: newValidatedValues,
          validateAllValues: false
        });

      } else {

        this.setState({
          validatedValues: deepClone(DEFAULT_STATE.validatedValues),
          validateAllValues: false
        });

      }
    }

    /**
     * Clears the record of which values have been touched, i.e. the values that
     * the validated component has updated or validated using any of the functions the
     * validator component provides
     */

    clearTouchedValues(){
      this.setState({
        touchedValues: {},
        validateAllValues: false
      });
    }

    _addValue(position, valuePath, value, options) {
      const currentValue = this._getCurrentValue(valuePath) || [];

      const newValue = function(){
        if (options.allowDuplicates === false && currentValue.indexOf(value) !== -1) {
          return currentValue;
        }

        if (position === 'start') {
          return [ value, ...currentValue ];
        } else {
          return [ ...currentValue, value ];
        }
      }();

      this.changeValue(
        valuePath,
        newValue,
        options
      )
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

          return mergeValidatedValuePaths(valuePathsList, validatedValues);
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

    _omitDeep(target, valueToOmit){

      if (valueToOmit) {
        if (isPlainObject(target)) {

          return reduce(target, (memo, value, key) => {

            if (!isString(valueToOmit[key])) {
              memo[key] = this._omitDeep(value, valueToOmit[key]);
            }

            return memo;
          }, {});

        } else if (Array.isArray(target)) {

          return reduce(target, (memo, value, index) => {

            if (!isString(valueToOmit[index])) {
              memo.push(this._omitDeep(value, valueToOmit[index]));
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

      const externalErrors = get(this.props, externalErrorsPath || 'errors', {});
      const baseErrors = this._omitDeep(externalErrors, touchedValues);

      if (validateAllValues) {
        return defaultsDeep({}, errors, baseErrors);
      } else {
        return defaultsDeep(pickErrors(errors, validatedValues), baseErrors);
      }
    }

    _valuesWithDefaults({ values, touchedValues }){

      if (only) {
        const validateableFields = arrayFrom(only);

        const propValues = reduce(validateableFields, (memo, path) => {
          const pathSegments = path.split(/[.[]/);

          /**
           * When using a complex or nested path for the 'only' option, we need
           * to copy the root object - not just the leaf node - to ensure attributes
           * in that root object that are not being validated, aren't omitted when
           * it comes time to (deeply) merge in the validated values
           */
          const pathRoot = pathSegments.length > 1 ? pathSegments[0] : path;

          const sourceValue = get(this.props, pathRoot);
          set(memo, pathRoot, sourceValue);

          return memo;
        }, {});

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

    _getCurrentValue(path) {
      return get(unwrapObject(this._valuesWithDefaults(this.state)), path);
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
            const messageWithFieldNameRemoved = message.replace(/^".+" /, '');

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
        const callback = (() => {
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
        })();

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

  return ValidatorComponent;
};

ReactJoiValidation.setJoi = function(joiClass) {
  Joi = joiClass;
};

ReactJoiValidation.setChangeHandlerStrategy = function(changeHandlerStrategy) {
  defaultChangeHandlerStrategy = changeHandlerStrategy;
};

export default ReactJoiValidation;
