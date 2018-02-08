// Type definitions for React Joi Validation
// Project: react-joi-validation

import { Component } from 'react';
import * as Joi from 'joi';

export function guessCorrectValue(event: Event, value: any): any;
export function useEventTargetValue(event: Event): any;
export function useFirstArgument<T>(value: T): T;
export function useSecondArgument<T>(arg1: any, value: T): T;
export function useThirdArgument<T>(arg1: any, arg2: any, value: T): T;

type Path = String;
type ListOrSingle<T> = T|Array<T>;

interface ValidatorComponentProps {

}

interface ValidatedComponentProps extends ValidatorComponentProps {
    errors: object;

    changeHandler: (path: Path, options?: { value?: any, strategy?: Function, validate?: boolean, callback?: Function }) => () => void;
    changesHandler: (changes: Array<[Path,any]>, options?: { validate?: boolean, callback?: Function }) => () => void;
    changeValue: (path: Path, value: any, options?: { validate?: boolean, callback?: Function }) => void;
    changeValues: (changes: Array<[Path,any]>, options?: { validate?: boolean, callback?: Function }) => void;

    pushHandler: (path: Path, options?: { allowDuplicates?: boolean, value?: any, strategy?: Function, validate?: boolean, callback?: Function }) => () => void;
    pushValue: (path: Path, value: any, options?: { allowDuplicates?: boolean, validate?: boolean, callback?: Function }) => void;
    togglePushHandler: (path: Path, options?: { value?: any, strategy?: Function, validate?: boolean, callback?: Function }) => () => void;
    togglePushValue: (path: Path, value: any, options?: { validate?: boolean, callback?: Function }) => void;

    unshiftHandler: (path: Path, options?: { allowDuplicates?: boolean, value?: any, strategy?: Function, validate?: boolean, callback?: Function }) => () => void;
    unshiftValue: (path: Path, value: any, options?: { allowDuplicates?: boolean, validate?: boolean, callback?: Function }) => void;
    toggleUnshiftHandler: (path: Path, options?: { value?: any, strategy?: Function, validate?: boolean, callback?: Function }) => () => void;
    toggleUnshiftValue: (path: Path, value: any, options?: { validate?: boolean, callback?: Function }) => void;

    pullHandler: (path: Path, options?: { index?: number, removeAllInstances?: boolean, value?: any, strategy?: Function, validate?: boolean, callback?: Function }) => () => void;
    pullValue: (path: Path, value: any, options?: { index?: number, removeAllInstances?: boolean, validate?: boolean, callback?: Function }) => void;

    validateAllHandler: (callback?: Function) => () => void;
    validateAll: (callback?: Function) => void;
    validateHandler: (paths: ListOrSingle<Path>, callback?: Function) => () => void;
    validate: (paths: ListOrSingle<Path>, callback?: Function) => void;

    clearValidationAndResetValues: (paths?: ListOrSingle<Path>) => void;
    clearValidation: (paths?: ListOrSingle<Path>) => void;
    clearTouchedValues: () => void;
}

interface ValidatorComponentPropsWithChildren extends ValidatorComponentProps {
    children: Component<ValidatedComponentProps, object>;
}

interface ValidatorComponentState {
    errors: object;
    values: object;
    touchedValues: object;
    validatedValues: object;
    changingValues: Array<Path>;
    validatedAllValues: boolean;
}

interface ValidatorOptions extends ValidatorComponentState {
    valuesWithDefaults: object;
    touchedValues: Array<Path>;
    validatedValues: Array<Path>;
    props: ValidatorComponentProps;
    errors: object;
}

type ValidatorFunction = (options: ValidatorOptions) => { errors: object, values: object };

export default function(ValidatedComponent: Component, options: {
    joiSchema?: Joi.Schema,
    joiOptions?: Joi.ValidationOptions,
    validator?: ListOrSingle<ValidatorFunction>,
    only?: ListOrSingle<Path>,
    pseudoValues?: ListOrSingle<Path>,
    externalErrorsPath?: Path,
    changeHandlerStrategy?: Function,
} = { pseudoValues: [], changeHandlerStrategy: guessCorrectValue }): Component<ValidatorComponentPropsWithChildren, ValidatorComponentState>;
