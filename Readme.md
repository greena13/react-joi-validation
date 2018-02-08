# react-joi-validation

[![npm](https://img.shields.io/npm/dm/react-joi-validation.svg)]()
[![Build Status](https://travis-ci.org/greena13/react-joi-validation.svg)](https://travis-ci.org/greena13/react-joi-validation)
[![GitHub license](https://img.shields.io/github/license/greena13/react-joi-validation.svg)](https://github.com/greena13/react-joi-validation/blob/master/LICENSE)

## Features

* Extremely flexible and easy to integrate with your data persistence and UI layers
* Validate all or some of a component's values
* Can be used for form validation or with any other component you like
* Use the powerful declarative [Joi API](https://github.com/hapijs/joi/blob/master/API.md) or write your own validator functions - or both!
* Does not include Joi as a dependency to remain light weight, allow gradual integration into your projects and to remain environment agnostic - just point `react-joi-validation` at the version of Joi that is right for your project's environment and it will use it.
* Transparently handles client and server data validations


## Usage

```javascript
import validate from 'react-joi-validation';

var schema = Joi.object().keys({
  username: Joi.string().required(),
  password: Joi.string().min(8).required()
});

class MyComponent extends Component {
  render() {
    const {
      user: { username, password },
      errors, changeHandler, validateHandler
    } = this.props;

    return(
      <div >
        <input type="text"
          value={username}
          onChange={ changeHandler('username') }
          onBlur={ validateHandler('username') }
        />

        <span className={style.error}> { errors.username } </span>

        <input type="password"
          value={password}
          onChange={ changeHandler('password') }
          onBlur={ validateHandler('password') }
        />

        <span className={style.error}> { errors.password } </span>

        <input type="Submit" value="Sign In" />
      </div>
    );
  }
}

MyComponent.defaultProps = {
  username: '',
  password: ''
};

var validationOptions = {
  joiSchema: schema,
  only: 'user'
};

validate(MyComponent, validationOptions)
```
## Installation

```bash
npm install react-joi-validation --save
```

If you are planning on using `react-joi-validations` with Joi, you also need to follow the installation instructions for the version and type of Joi you wish to use. [joi-browser](https://github.com/jeffbski/joi-browser) is recommended for web applications.

Once you have a version of Joi installed, just let `react-joi-validations` know about it somewhere near the entry point of your code (before any other calls to `react-joi-validations`):

```javascript
import ReactJoiValidations from 'react-joi-validation'
import Joi from 'joi-browser' // or whatever Joi library you are using

ReactJoiValidations.setJoi(Joi);
```


## What version of Joi should I use?

Joi is not listed as a peer dependency for `react-joi-validation` as there are many flavours and forks of Joi out there that provide similar behaviour and APIs in different environments and `react-joi-validation` should work with any of them. In fact, you do not need to use Joi at all if you do not want to.

`react-joi-validation` was developed and tested using [joi-browser](https://github.com/jeffbski/joi-browser) in a client-side environment.

## How it works

`react-joi-validation` works by providing a higher order function that wraps any component you wish to validate. It maintains values in its own state and passes them down to your component as props, along with a number of functions you can use to update and validate those values as the user interacts with your component.

 The validator component merges the values you define in your component's `defaultProps`, the values you pass the validator component's `props` and the values you set using change handlers when the user interacts with your UI.

 It then runs these merged values through a Joi schema that you provide and/or one or more validator functions you define. The resultant error object is merged with errors passed to the validator components `props` (allowing you to validate with your server or some other external party) and passed down to your component.

### Guiding concepts

 * **Succinct and expressive syntax** - `react-joi-validation` removes the need in most cases for defining handlers for user events. You can do them inline for your UI at render time, or add a line to your existing event handler methods if you need custom logic or easy integration with your existing code.
 * **Complete UI independence** - `react-joi-validation` wraps your component and provides change handlers and an error object. What you do with those errors and how you display them is entirely up to you.
 * **Separation of change and validation events** - the validation of values is done separately to maintaining the changes to those values. Often you want to validate a user's input only after they have completed entering it. Because of this decoupling, you can even validate fields other than those that were just changed. This allows validating groups of values when the user has completed setting the final value.
 * **Selective, explicit validation** - `react-joi-validation` makes validating each value explicit, so you can validate a user's input as they do it, rather than validating all fields before the user has even got to them.
 * **Full validation flexibility** - you can chose to use Joi or your own validator functions or trigger events that pass errors in as `props`, making it easy to integrate with any existing project.
 * **Easy integration with external validation** - in addition to the validation `react-joi-validation` performs, it also allows passing in errors from external sources such as errors from your server. It transparently merges them with the `react-joi-validation` errors.
 * **Flexible default values** - it's possible to set defaults for values using either the component's `defaultProps` or the `props` to the validator component (or both). This makes it possible to set default values dynamically at runtime.


## Higher Order Function API

### Using Joi

#### Passing a validation schema

Joi has a very powerful, declarative [API](https://github.com/hapijs/joi/blob/master/API.md). You can use any object that `Joi.validate` would normally accept as a schema, this includes:

> a joi type object or a plain object where every key is assigned a joi type object

You pass it using the `joiSchema` option:

```javascript
var schema = {
  a: Joi.string()
};

validate(MyComponent, { joiSchema: schema })
```

#### Configuring Validation

You can configure Joi's validation by passing an object to `joiOptions` that contains any of `Joi.validate`'s [supported options](https://github.com/hapijs/joi/blob/master/API.md#validatevalue-schema-options-callback).

 ```javascript
 validate(MyComponent, { joiSchema: schema, joiOptions: { allowUnknown: true }})
```

By default, each validation is performed with `abortEarly` option set to false, so all errors are shown - not just the first encountered. This can be overridden, however:

```javascript
 validate(MyComponent, { joiSchema: schema, joiOptions: { abortEarly: true }})
```

### Scoping validation

#### Validating all of a component's props

By default, `react-joi-validation` will validate all props passed to your component, so you do not need to do anything additional.

#### Validating a single prop

If you only want to validate a single prop and ignore all others, you can use the `only` option

```javascript
validate(MyComponent, { only: 'user', joiSchema: schema })
```

This applies the validation `schema` to the `user` prop only, (so you do not need to nest your validation under `user`):

```javascript
// This would work as intended
var schema = Joi.object().keys({
  username: Joi.string().required(),
  password: Joi.string().min(8).required()
});

// This would also work
var schema = {
  username: Joi.string().required(),
  password: Joi.string().min(8).required()
};

// This would NOT work
var schema = {
  user: Joi.object().keys({
    username: Joi.string().required(),
    password: Joi.string().min(8).required()
  })
};
```

#### Validating multiple props

When the `only` option is passed an array, it applies `schema` to an object with only those values and excludes all others.

```javascript
var schema = {
  user: Joi.object().keys({
    username: Joi.string().required(),
    password: Joi.string().min(8).required()
  }),

  order: Joi.object().keys({
    number: Joi.number().required()
  })
};

validate(MyComponent, { only: ['user', 'order'], joiSchema: schema })

//...

<MyComponent user={user} order={order} message={message}/>
```
An point of note is that `only: [user]` is **not** the same as `only: 'user'`. The former applies `schema` to `{ user: <user> }` while the latter applies it to `<user>`.

### Using a validator function

In addition to, or instead of, a Joi schema, you can pass a custom validator function using the `validator` option:

```javascript
validate(MyComponent, { validator: myValidatorFunction })
```

This is useful for performing validation not possible with the Joi syntax. Please refer to the [validator function interface](#validator-function-interface) section for more information.

#### Chaining validators

You can also use more than one validator at a time by providing an array to `validators`. The validators are executed in the order that they appear in the array and the `values` and `errors` passed to the callback by each validator are given to the next one in the chain. The `values` and `errors` outpu by the final validator are saved in the validator component.

```javascript
validate(MyComponent, { validator: [ validator1, validator2 ] })
```

### Pseudovalues

Sometimes it is convenient to have your validator place error messages on attributes of `errors` that do not correspond with any of the actual values being passed down. One example of this is a user must select at least one option from either of two lists and an error message doesn't really fit on either of the individual lists.

You can achieve this using pseudovalues, which are like extra hooks to hang your error messages on. They do not have values or get passed down to the wrapped component, but they can place errors into the `errors` prop. They can also be the target of a validation action.

`pseudoValues` accepts either a string or an array of strings, indicating the names of the pseudovalues you would like to use.

```javascript

function validateAtLeastOneProductOrService({ valuesWithDefaults, values, validateAllValues, validatedValues, errors }, callback){
  const { products, services } = valuesWithDefaults;

  if (validateAllValues || validatedValues.includes('billableItems')) {
    if (products.length === 0 && services.length === 0) {
      errors.billableItems = 'Must select at least one product or service';
    }
  }

  callback({ values, errors });
}

validate(MyComponent, { validator: validateAtLeastOneProductOrService, pseudoValues: ['billableItems'] })

// MyComponent.js

// ...

<FormError>
  { errors.billableItems }
</FormError>

// ...

<product onClick={ changeHandler('product', { value: id, validate: 'billableItems' }) }>
  Product {id}
</product>

```

### Setting errors, externally

By default, `react-joi-validation` will merge any errors passed on the props `errors` with those resultant from validating the user input. This is useful for displaying validation errors from your server, or outside of your component. When the value is changed, it is marked as "touched" and any corresponding external errors are no longer present on the `errors` prop passed down to your component.

This means you can validate data externally and display the error until the user first changes its value (and the external error becomes stale). It then falls to local validation again before you to pass it back up to you server or external validation module for re-evaluating.

The prop used for external errors can be set using the `externalErrorsPath` option. This does **not** change the prop passed down to your component. That is always `this.props.errors`.


```javascript
 const MyValidatedComponent = validate(MyComponent, { joiSchema: schema, externalErrorsPath: 'response.errors'})

 <MyValidatedComponent response={ { errors } } />

```

## Wrapped Component API

When working with your component that is wrapped by `react-joi-validations`, two types of functions are provided to you:

* Functions that return handlers for dealing with various events that give you a convenient for scoping simple event handling
* The event handlers themselves for when you need to wrap your event handling in some custom logic

### Updating values

These helpers are for when you want to update the state of the validation component so it has the correct values to perform validation against. They do not actually trigger validation, unless otherwise specified.

#### changeHandler

`changeHandler` is for when you simply want to keep a value in sync with what appears on the UI. It accepts the name of the value to update and an optional set of configuration object. It returns a function that will accept an event object as the first argument and the new value as the second.

```javascript
const { user: { username }, changeHandler } = this.props;

return(
  <div>
    <input value={username} onChange={changeHandler('username')} />
  </div>
)
```

By default `react-joi-validation`'s `changeHandler` function will return a handler that will try and guess which argument it should use as the value for validation when it is called. This should cover 90% of use cases, as it handles the event handler signature used by the standard `<input />` tag.

There are 3 places you can specify an alternative strategy to use:

* The `setChangeHandlerStrategy()` function sets the default handler strategy that should be used globally - it only needs to be called once at the entry point of your application.

```
import ReactJoiValidations, { guessCorrectValue } from 'react-joi-validation'

ReactJoiValidations.setChangeHandlerStrategy(guessCorrectValue);
```

* The `changeHandlerStrategy` option can be passed to `validate` and sets the default handler strategy for a single component and takes precedence over any default specified using `setChangeHandlerStrategy()`:

```
import validate, { guessCorrectValue } from 'react-joi-validation'

var validationOptions = {
  joiSchema: schema,
  only: 'user',
  changeHandlerStrategy: guessCorrectValue,
};

validate(MyComponent, validationOptions)
```

* The `strategy` option can be passed to `changeHandler` and sets the handler strategy for a single change handler and takes precedence over any default specified using `setChangeHandlerStrategy()` or `changeHandlerStrategy`:

```
import validate, { guessCorrectValue } from 'react-joi-validation'

<product onClick={ changeHandler('product', { startegy: guessCorrectValue }) }>
  Product {id}
</product>
```

`react-joi-validation` exports several pre-defined strategies you can import directly into your project:

* `guessCorrectValue` - (Default) Uses `firstArg.event.target` if it's present, otherwise uses `secondArg`.
* `useFirstArgument` - Uses the (entire) first argument and ignores all others
* `useSecondArgument` - Uses the second argument and ignores all others
* `useThirdArgument` - Uses the third argument and ignores all others
* `useEventTargetValue` - Uses `firstArg.event.target` (and returns `undefined` when it is not present)

If these do not cover what you need, you can pass a custom function that returns the value that should be used for validation every time the change handler is called:

```
import validate, { guessCorrectValue } from 'react-joi-validation'

var validationOptions = {
  joiSchema: schema,
  only: 'user',
  changeHandlerStrategy: (arg1, arg2) => {
    return arg2.really.strange.format[0].value;
  },
};

validate(MyComponent, validationOptions)
```

> Change handler strategies are ignored when the `changeHandler`'s `value` option is also used

##### Validating on every change

If you want to validate on every change, you can do so using the options argument:

```javascript
return(
  <input value={username} onChange={changeHandler('username', { validate: true })} />
)
```

You can also validate a field other than the one you are modifying by providing it as a string instead of `true` to the `validate` option.

##### Setting value on render

You can set the value a user interaction will have at render time using the `options.value` argument:

```javascript
return(
  <input type='button' value={termsAndConditions} onChange={changeHandler('username', { value: true })} />
)
```

#### changeValue

`changeValue` is for whenever `changeHandler` is not flexible enough. It accepts the name of the value to change and the new value.

```javascript
render() {
  const { user: { username } } = this.props;

  return(
    <div>
      <input value={username} onChange={this.handleUsernameChange} />
    </div>
  )
}

handleUsernameChange(event, newUsername){
  const { changeValue } = this.props;

  // custom code here
  changeValue('username', newUsername)
}
```

### Changing multiple values at once

#### changesHandler

Similar to `changeHandler`, but accepts an array of path-value tuples that list the changes to be made.

```javascript
return(
  <button onChange={changesHandler([['username', ''], ['password', '']])}   >
    Clear
  </button>
)
```

`changesHandler` accepts the same options as `changeHandler`. If `validate: true` is used, all values listed in the array are validated.

#### changeValues

Similar to `changeValue`, but accepts an array of path-value tuples that list the changes to be made.

```javascript
render() {
  return(
    <div>
      <button onChange={this.handleClearValues} >
        Clear
      </button>
    </div>
  )
}

handleClearValues(event){
  const { changeValues } = this.props;

  // custom code here
  changeValues([ ['username', ''], ['password', ''] ])
}
```

`changeValues` accepts the same options as `changeValue`. If `validate: true` is used, all values listed in the array are validated.

### Working with arrays

Although you can work with the functions above to maintain array values, additional syntactic sugar has been provided:

#### pushHandler

Similar to `changeHandler`, but rather than replace the value at the provided `path` with a new one, it will push the new value onto the end of the array stored at `path`. This is useful for when checkboxes are ticked or similar situations where new values need to be added to a list.

`pushHandler` accepts all of the options that `changeHandler` does, and one extra:

- `allowDuplicates` - (Default: `true`) Whether to push a value onto the array if that value is already in the list.

```javascript
render() {
  const { pushHandler, cities } = this.props;

  return(
    ["Paris", "New York City", "London"].map((city) => {
      return(
        <input type='button' label={ "Add " + city } onClick={ pushHandler('cities') } />
      );
    }
  );
}
```

#### pushValue

`pushValue` is for whenever `pushHandler` is not flexible enough. It accepts a `path` to an array to push a `value` to.

`pushValue` accepts all of the options that `changeValue` does, and one extra:

- `allowDuplicates` - (Default: `true`) Whether to push a value onto the array if that value is already in the list.

```javascript
render() {
  return(
    ["Paris", "New York City", "London"].map((city) => {
      return(
        <input type='button' label={ "Add " + city } onClick={ this.handleAddCity(city) } />
      );
    }
  );
}

handleAddCity(city) {
   const { pushValue, cities } = this.props;

   if (cities.indexOf(city) === -1 ) {
      pushValue('cities', city);
   }
}
```

#### togglePushHandler

Returns a function that, when called, pushes a value onto the end of an array if that value is not already in the array, otherwise it removes it. i.e. it toggles that value's inclusion in the array.

`togglePushHandler` accepts all of the options that `changeHandler` does.

```javascript
render() {
  const { togglePushHandler, cities } = this.props;

  return(
    ["Paris", "New York City", "London"].map((city) => {
      return(
        <label>
            <input type='checkbox' onClick={ togglePushHandler('cities') } />
            { city }
        </label>
      );
    }
  );
}
```

#### togglePushValue

Pushes a value onto the end of an array if that value is not already in the array, otherwise it removes it. i.e. it toggles that value's inclusion in the array.

`togglePushValue` accepts all of the options that `changeValue` does.

```javascript
render() {
  return(
    ["Paris", "New York City", "London"].map((city) => {
      return(
        <label>
            <input type='checkbox' onClick={ this.handleToggleCity('cities') } />
            { city }
        </label>
      );
    }
  );
}

handleToggleCity(city) {
   const { togglePushHandler, cities } = this.props;

  togglePushHandler('cities', city);
}
```

#### unshiftHandler

Similar to `pushHandler`, but will add the new value to the *beginning* of an array, rather than at the end.

`unshiftHandler` accepts all of the options that `pushHandler` does, and one extra:

- `allowDuplicates` - (Default: `true`) Whether to unshift a value onto the array if that value is already in the list.

#### unshiftValue

Similar to `pushValue`, but will add the new value to the *beginning* of an array, rather than at the end.

`unshiftValue` accepts all of the options that `changeValue` does, and one extra:

- `allowDuplicates` - (Default: `true`) Whether to push a value onto the array if that value is already in the list.

#### toggleUnshiftHandler

Similar to togglePushHandler, but instead the returned function, when called, adds a value to the start of an array if that value is not already in the array, otherwise it removes it. i.e. it toggles that value's inclusion in the array.

`toggleUnshiftHandler` accepts all of the options that `changeHandler` does.

#### toggleUnshiftValue

Similar to togglePushValue, but instead it adds a value to the start of an array if that value is not already in the array, otherwise it removes it. i.e. it toggles that value's inclusion in the array.

`toggleUnshiftValue` accepts all of the options that `changeValue` does.


#### pullHandler

The opposite of `pushHandler` and `unshiftHandler`, `pullHandler` will remove one or more elements from an array stored at `path`.

`pullHandler` accepts a `path` to the array to remove an element from, and an `options` hash. It returns a handler function, that when called, will remove the value passed to it from the array.

Exactly how this is done depends on what options are provided:

* `<no options>` - (Default) Only the *first* instance of the value passed to the handler will be removed from the array at `path`.
* `index=<int>` - The element at the specified index will be removed from the array at `path`
* `removeAllInstances` - When set to `true`, (default is `false`), *all* instances of the value passed to the handler will be removed from the array at `path`.

Default behaviour:

```javascript
render() {
  const { pullHandler, pullHandler, cities } = this.props;

  return(
    cities.map((city) => {
      return(
        <input type='button' label={ "Remove " + city } onClick={ pullHandler('cities') } />
      );
    }
  );
}
```

Using the `index` option:

```javascript
render() {
  const { pullHandler, pullHandler, cities } = this.props;

  return(
    cities.map((city, index) => {
      return(
        <input type='button' label={ "Remove " + city } onClick={ pullHandler('cities', { index: index }) } />
      );
    }
  );
}
```

Using the `removeAllInstances` option:

```javascript
render() {
  const { pullHandler, cities } = this.props;

  return(
    cities.map((city, index) => {
      return(
        <input type='button' label={ "Remove " + city } onClick={ pullHandler('cities', { removeAllInstances: true }) } />
      );
    }
  );
}
```

#### pullValue

`pullValue` is for whenever `pullHandler` is not flexible enough. It accepts a `path` to an array to remove a `value` from.

`pullValue` accepts all of the options that `pullHandler` does.

```javascript
render() {
  const { cities } = this.props;

  return(
    cities.map((city, index) => {
      return(
        <input type='button' label={ "Remove " + city } onClick={ this.handleRemoveCity } />
      );
    }
  );
}

handleRemoveCity(city) {
   const { pullValue, cities, user } = this.props;

   if (user.isAdmin) {
      pullValue('cities', city);
   }
}
```

### Accessing Errors

A component's errors are accessible via the `errors` prop, which is an object keyed by value names. If the object is empty, then there are no errors.

### Triggering validation

`react-joi-validation` was designed with form validation in mind. As such, it only validates values the values that it is told to, when it is told to. This makes it trivial to validate each field after the user has interacted with it, leaving the rest of the form error free.


```javascript

render() {
  const { user: { username }, errors } = this.props;

  return(
    <div>
      <input value={username} />

      <span style={styles.error}>
        { errors.username }
      </span>
    </div>
  )
}
```

Depending on the options you pass to `only`, the errors may be nested more deeply: e.g. `errors.user.username`.

#### validateHandler

`validateHandler` is for simple cases where you just want validate a single value after a particular event (such as when a field loses focus). It accepts either the name of the value it should validate, or an array of values it should validate as the first argument and an optional callback for once the validation has been complete as the second argument.

##### Validating a single value

```javascript
const { user: { username }, changeHandler, validateHandler } = this.props;

return(
  <div>
    <input value={username}
      onChange={changeHandler('username')}
      onBlur={validateHandler('username')}
    />
  </div>
)
```

##### Validating multiple values at once

```javascript
const { address: { country, postcode }, changeHandler, validateHandler } = this.props;

return(
  <div>
    <input value={postcode}
      onChange={changeHandler('postcode')}
    />

    <input value={country}
      onChange={changeHandler('country')}
      onBlur={validateHandler(['postcode','country'])}
    />
  </div>
)
```

#### validate

`validate` is for whenever `validateHandler` is not flexible enough. It accepts the name of the value to validate.

```javascript
render() {
  const { user: { username }, changeHandler } = this.props;

  return(
    <div>
      <input value={username}
        onChange={changeHandler('username')}
        onBlur={this.handleUsernameValidation}
      />
    </div>
  )
}

handleUsernameValidation(event){
  const { validate } = this.props;

  // custom code here

  validate('username')
}
```

#### validateAllHandler

`validateAllHandler` is for simple cases where you want to validate all values currently in the validation component's state (including values set by `defaultProps` and passed in as props). It accepts a callback to be executed when the validation is complete (and the current `errors` object is available in props).

```javascript
render() {
  const { user: { username }, changeHandler, validateAllHandler } = this.props;

  return(
    <div>
      <input value={username}
        onChange={changeHandler('username')}
      />

      <input type="submit" onClick={validateAllHandler(this.handleValidation)} />
    </div>
  )
}

handleValidation(){
  const { errors } = this.props;

  if (!any(errors)) {
    // navigate away
  }
}
```

#### validateAll

`validateAll` is for when `validateAllHandler` is not flexible enough. It accepts a callback as it's only argument, which is invoked when the validation has been completed.

```javascript
render() {
  const { user: { username }, changeHandler } = this.props;

  return(
    <div>
      <input value={username}
        onChange={changeHandler('username')}
      />

      <input type="submit" onClick={this.handleValidation} />
    </div>
  )
}

handleValidation(){
  const { validateAll } = this.props;

  // custom code here

  validateAll(() => {
    const { errors } = this.props;

    if (!any(errors)) {
      // navigate away
    }
  });
}
```

### Clearing the validation state

#### Clearing validation errors

It's possible to clear the validation errors for some or all of the data your component is managing. Calling `clearValidation` with no arguments will clear all errors. You can selectively clear validation errors for individual attributes by passing a path as a string or array of path strings.

```javascript
handleValidation() {
  const { clearValidation, overrideValidation } = this.props;

  if (overrideValidation) {
    clearValidation(); // or clearValidation('user.username')
  }
}
```

#### Clearing validation errors and resetting values

If you want to reset some or all attributes back to their default values (or the values  passed in as props) and clear the corresponding validation errors, it can be done using the `clearValidationAndResetValues`. Similar to `clearValidation`, it can be called with no arguments to clear all errors and values or with paths to selectively clear attributes and any corresponding validation errors.

This is useful when you want to pass responsibility for the data out of the component (say, to place it in your store, or to send to your server for validation). You  need to clear the validation component's state so when the data is passed back in via `props` to the component after having come back from your server or been persisted to your store, the validation component's state values don't take precedence.

```javascript
handleValidation(){
  const { validateAll } = this.props;

  // custom code here

  validateAll(() => {
    const { errors, clearValidationAndResetValues } = this.props;

    if (!any(errors)) {
      // send to your store or server

      this.clearValidationAndResetValues()
    }
  });
}
```

## Validator function interface

A custom validator function can be used with or instead of a Joi validation schema. It is passed using the `validator` option to the higher order component API (see [Using a validator function](#using-a-validator-function) for details).

The function must accept two arguments: an object of options and a callback. The options object contains the following values:

**OK to modify or replace:**
* `values` - an object of values that will replace the current state when the validation is complete. This is used both for inspecting the current values and can be mutated to replace them. It represents only those values set using one of the `changeXXX` methods. It does not include default values set using the validator component's props or the wrapped component's `defaultProps`.
* `errors` - an object of the errors output by the Joi validation, if a `joiSchema` was provided to `react-joi-validation` (otherwise an empty object). This give the function the opportunity to see if Joi detected any invalid attributes and to override them by mutating the object.

**Do not modify or replace:**

* `valuesWithDefaults` - an object containing the deeply merged values stored in state with the default values set using props and the wrapped component's `defaultProps`. This is the actual object used internally for validating with the Joi schema, and passed down as props to the wrapped component.
* `validateAllValues` - a boolean indicating whether all values should be validated (including those not listed in `validatedValues`). Useful for only running the custom validations when all values should be present.
* `validatedValues` - an array of value paths (strings) that record which values should be validated. Should be used in conjunction with `validateAllValues` to decide if you should validate particular fields even when they are not listed in `validatedValues`.
* `changingValues` - an array of value paths that indicate which values have changed since the last time the validator was called. This is useful for only modifying `values` when certain fields are modified.
* `props` - the props passed to the validator component. This is useful when the `only` option is in effect, for using prop values outside the validation schema to validate values in it.


The function **must** call the callback with an object containing two attributes:
* `values`: the object of values, which may be unchanged or mutated by the validator function
* `errors`: the object of errors, which may be unchanged or mutated by the validator function

```javascript
function validateSquareNumberOfImages({ values, validateAllValues, validatedValues, errors }, callback){
  const { images } = values;

  if (validateAllValues || includes(validatedValues, 'images')) {
    if (isSquareNumber(images.length) ) {
      errors['images'] = 'Must select a square number of images';
    }
  }

  callback({ values, errors });
}
```

## Running the test suite

You can run the complete test suite using the following command:

```bash
npm run tests
```

If you are creating a contribution and would like to run the tests whenever you save a file:

```bash
npm run watch-tests
```

## Contributions

All contributions are welcome and encouraged.

## Similar libraries

If `react-joi-validation` does not meet your needs for whatever reason, you may want to check out [react-validation-mixin](https://github.com/jurassix/react-validation-mixin).

