// Type definitions for React Joi Validation
// Project: react-joi-validation

import { Component } from 'react';
import * as Joi from 'joi';

/**
 * Takes arguments that resemble those commonly passed to event handlers and attempts
 * to guess what the desired event value should be. This function is the default used
 * by all *Handler methods to extract values from events so that they can be set and
 * validated.
 */
export function guessCorrectValue(event: Event, value: any): any;

/**
 * Returns the target value of an event that is passed to it
 */
export function useEventTargetValue(event: Event): any;

/**
 * Returns the first argument. Used for adapting event handlers that return the event
 * value as the first argument.
 */
export function useFirstArgument<T>(value: T): T;

/**
 * Returns the second argument. Used for adapting event handlers that return the event
 * value as the second argument.
 */
export function useSecondArgument<T>(arg1: any, value: T): T;

/**
 * Returns the third argument. Used for adapting event handlers that return the event
 * value as the third argument.
 */
export function useThirdArgument<T>(arg1: any, arg2: any, value: T): T;

/**
 * A string that describes a path to a particular value, using periods or square
 * parenthesis to indicate nesting
 */
type Path = String;

/**
 * A single item of a given type, or an array of that type
 */
type ListOrSingle<T> = T|Array<T>;

interface ValidatorComponentProps {

}

interface ValidatedComponentProps extends ValidatorComponentProps {
    errors: object;

    /**
     * Returns a function that, when called, updates the specified attribute with
     * a new value
     */
    changeHandler: (path: Path, options?: { value?: any, strategy?: Function, validate?: boolean, callback?: Function }) => () => void;

    /**
     * Returns a function that, when called, updates multiple attributes with new values
     */
    changesHandler: (changes: Array<[Path,any]>, options?: { validate?: boolean, callback?: Function }) => () => void;

    /**
     * Updates an attribute with a new value
     */
    changeValue: (path: Path, value: any, options?: { validate?: boolean, callback?: Function }) => void;

    /**
     * Updates multiple attributes with new values
     */
    changeValues: (changes: Array<[Path,any]>, options?: { validate?: boolean, callback?: Function }) => void;

    /**
     * Returns a function that, when called, pushes a value onto the end of an array
     * stored in the validator component's state
     */
    pushHandler: (path: Path, options?: { allowDuplicates?: boolean, value?: any, strategy?: Function, validate?: boolean, callback?: Function }) => () => void;

    /**
     * Immediately pushes a value onto the end of an array
     */
    pushValue: (path: Path, value: any, options?: { allowDuplicates?: boolean, validate?: boolean, callback?: Function }) => void;

    /**
     * Returns a function that, when called, pushes a value onto the end of an array
     * if that value is not already in the array, otherwise it removes it. i.e. it
     * toggles that value's inclusion in the array.
     */
    togglePushHandler: (path: Path, options?: { value?: any, strategy?: Function, validate?: boolean, callback?: Function }) => () => void;

    /**
     * Immediately pushes a value onto the end of an array if that value is not
     * already in the array, otherwise it removes it. i.e. it toggles that value's
     * inclusion in the array.
     */
    togglePushValue: (path: Path, value: any, options?: { validate?: boolean, callback?: Function }) => void;

    /**
     * Similar to pushValueHandler, but the returned function, when called,
     * adds a value to the beginning of an array, instead
     */
    unshiftHandler: (path: Path, options?: { allowDuplicates?: boolean, value?: any, strategy?: Function, validate?: boolean, callback?: Function }) => () => void;

    /**
     * Similar to pushValue, but immediately adds a value to the beginning of an array
     * instead
     */
    unshiftValue: (path: Path, value: any, options?: { allowDuplicates?: boolean, validate?: boolean, callback?: Function }) => void;

    /**
     * Returns a function that, when called, adds a value to the beginning of an array
     * if that value is not already in the array, otherwise it removes it. i.e. it
     * toggles that value's inclusion in the array.
     */
    toggleUnshiftHandler: (path: Path, options?: { value?: any, strategy?: Function, validate?: boolean, callback?: Function }) => () => void;

    /**
     * Immediately pushes a value to the beginning of an array if that value is not
     * already in the array, otherwise it removes it. i.e. it toggles that value's
     * inclusion in the array.
     */
    toggleUnshiftValue: (path: Path, value: any, options?: { validate?: boolean, callback?: Function }) => void;

    /**
     * The opposite of pushHandler and unshiftHandler; returns a function that,
     * when called, will remove one or more instances of a value from an array.
     *
     * The default behaviour is to remove only the first instance of the specified
     * value from the array. i.e. the instance of the value with the lowest index.
     */
    pullHandler: (path: Path, options?: { index?: number, removeAllInstances?: boolean, value?: any, strategy?: Function, validate?: boolean, callback?: Function }) => () => void;

    /**
     * The opposite of pushValue and unshiftValue; immediately removes a value from
     * an array.
     *
     * The default behaviour is to remove only the first instance of the specified
     * value from the array. i.e. the instance of the value with the lowest index.
     */
    pullValue: (path: Path, value: any, options?: { index?: number, removeAllInstances?: boolean, validate?: boolean, callback?: Function }) => void;

    /**
     * Returns a function that, when called, validates all values currently in the
     * validation component's state (including values set by defaultProps and passed
     * in as props).
     */
    validateAllHandler: (callback?: Function) => () => void;

    /**
     * Validates all values currently in the validation component's state
     * (including values set by defaultProps and passed in as props).
     */
    validateAll: (callback?: Function) => void;

    /**
     * Returns a function that, when called, validates some of the values currently
     * in the validation component's state (including values set by defaultProps
     * and passed in as props).
     */
    validateHandler: (paths: ListOrSingle<Path>, callback?: Function) => () => void;

    /**
     * Validates some of the values currently in the validation component's state
     * (including values set by defaultProps and passed in as props).
     */
    validate: (paths: ListOrSingle<Path>, callback?: Function) => void;

    /**
     * Clears the validation state and resets values for some or all of the values
     * being handled by the validator component.
     */
    clearValidationAndResetValues: (paths?: ListOrSingle<Path>) => void;

    /**
     * Clears the validation state for some or all of the values being handled by
     * the validator component. The actual values are NOT reset.
     */
    clearValidation: (paths?: ListOrSingle<Path>) => void;

    /**
     * Clears the record of which values have been touched, i.e. the values that
     * the validated component has updated or validated using any of the functions the
     * validator component provides
     */
    clearTouchedValues: () => void;
}

interface ValidatorComponentPropsWithChildren extends ValidatorComponentProps {
    children: Component<ValidatedComponentProps, object>;
}

interface ValidatorComponentState {
    /**
     * An object storing all of the validation errors for the values stored in
     * the validator component's state
     */
    errors: object;

    /**
     * An object containing all the values that have been set by the validated
     * component using the change helper methods
     */
    values: object;

    /**
     * An object containing references to all the values that have been changed
     * by the validated component using the change helper methods
     */
    touchedValues: object;

    /**
     * An object containing references to all the values that have been validated
     * by the validated component using the change or validate helper methods
     */
    validatedValues: object;

    /**
     * A list of values that are changing in the current update cycle
     */
    changingValues: Array<Path>;

    /**
     * Whether to validate all the values stored in the validator component's state
     * and not just those mentioned in validatedValues
     */
    validatedAllValues: boolean;
}

interface ValidatorOptions extends ValidatorComponentState {
    /**
     * An object of values set by starting with the props passed to the validated
     * component, and then deeply merging in the values that have been changed
     * by the validated component calling one of the change methods
     */
    valuesWithDefaults: object;

    /**
     * An array of value paths of all the values that have been changed
     */
    touchedValues: Array<Path>;

    /**
     * An array of value paths of all the values that have been validated
     */
    validatedValues: Array<Path>;

    /**
     * The props passed to the validator component
     */
    props: ValidatorComponentProps;

    /**
     * An object of errors resulting from applying the validations to the list
     * of validated values
     */
    errors: object;
}

type ValidatorFunction = (options: ValidatorOptions) => { errors: object, values: object };

/**
 * Component class that renders its children with props that contain functions for
 * updating and validating the values stored in the validator component's state.
 */
type ValidatorComponent = Component<ValidatorComponentPropsWithChildren, ValidatorComponentState>;

/**
 * Returns a validator component that wraps a validated component and provides
 * methods for updating and validating the validator component's state via the
 * validated component's props
 */
export default function(ValidatedComponent: Component, options: {
    /**
     * A Joi schema that, if provided, is used to validate the values stored in
     * the validator component's state every time
     */
    joiSchema?: Joi.Schema,

    /**
     * Options that are passed to Joi on every validation attempt. See the
     * documentation for the version of Joi that you are using.
     */
    joiOptions?: Joi.ValidationOptions,

    /**
     * A function or array of functions to use to validate the values stored in
     * the validator component's state every time one of the validate methods are
     * called. Can be used in conjunction with the joiSchema option, or without it.
     * If both are specified, the joiSchema validation is performed first and then
     * the validators are called in the order that they appear in the array.
     */
    validator?: ListOrSingle<ValidatorFunction>,

    /**
     * Path or paths to the part of the props object passed to the validator (and
     * passed through to the validated object) that should be validated against the
     * joi schema. Useful if you want to validate only part of the props.
     */
    only?: ListOrSingle<Path>,

    /**
     * List of paths to values that aren't actually in the props passed to the
     * validator component and are never set by the validated component, but are
     * accessible to attach validation errors to, in validator functions.
     */
    pseudoValues?: ListOrSingle<Path>,

    /**
     * Path to the attribute on props that stores the errors object of any
     * validation performed outside of the validator component. These errors are
     * merged into those set by the validator component.
     */
    externalErrorsPath?: Path,

    /**
     * The default change handler strategy to use in the validator component. i.e.
     * The default function that should be used to map the arguments of event handlers
     * to the validation handlers', provided by the validator component. If
     * unspecified, the default set at the package level using
     * setChangeHandlerStrategy() is used, or the guessCorrectValue function if none
     * has been otherwise specified.
     */
    changeHandlerStrategy?: Function,
} = { pseudoValues: [], changeHandlerStrategy: guessCorrectValue }): ValidatorComponent;
