# react-joi-validation

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

Once you have a version of Joi installed, just left `react-joi-validations` know about it somewhere near the entry point of your code (before any othes calls to `react-joi-validations`):

```javascript

import ReactJoiValidations from 'react-joi-validations'
import Joi from 'joi-browser' // or whatever Joi library you are using

ReactJoiValidations.setJoi(Joi)
```


## What version of Joi should I use?

Joi is not listed as a peer dependency for `react-joi-validation` as there are many flavours and forks of Joi out there that provide similar behaviour and APIs in different environments and `react-joi-validation` should work with any of them. In fact, you do not need to use Joi at all if you do not want to. 

`react-joi-validation` was developed and tested using [joi-browser](https://github.com/jeffbski/joi-browser) in a client-side environment.

## How it works

`react-joi-validation` works by providing a higher order function that wraps any component you wish to validate - say a form. It maintains values in its own state and passes them down to your component as props, along with a number of functions you can use to update and validate those values as the user interacts with your component.
 
 It takes default values from each attribute from your components `defaultProps` object and also allows passing in props that override these defaults.

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

`changleValue` is for whenever `changleHandler` is not flexible enough. It accepts the name of the value to change and the new value.

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

When you want to pass responsibility for the data out of the component (say, to place it in your store, or to send to your server for validation) you will need to clear the validation component's state (including errors and values) so when the data is passed back in via `props` to the component after having come back from your server or been persisted to your store, it is not overridden by the validation component's state values.

This can be done using the `clearValidationState` prop available to your wrapped component. It accepts no arguments and will clear the validation component's state, so you must only call it after you have copied your component's values somewhere else.

```javascript
handleValidation(){
  const { validateAll } = this.props;  
  
  // custom code here
  
  validateAll(() => {
    const { errors, clearValidationState } = this.props;
    
    if (!any(errors)) {
      this.clearValidationState()
      
      // display preloader and wait for server to confirm values      
    }
  });
}
```

## Validator function interface

A custom validator function can be used with or instead of a Joi validation schema. It is passed using the `validator` option to the higher order component API (see [Using a validator function](#using-a-validator-function) for details).
  
The function must accept two arguments: an object of options and a callback. The options object contains the following values:

* `values` - an object of values that will replace the current state when the validation is complete. This is used both for inspecting the current values and can be mutated to replace them.
* `errors` - an object of the errors output by the Joi validation, if also used (otherwise an empty object). This give the function the opportunity to see if Joi detected any invalid attributes and to override them by mutating the object.
* `validateAll` - a boolean indicating whether the current validation operation is to validate all values. Useful for only running the custom validations when all values should be present.
* `valuePaths` - an array of value paths that describes which values should be validated in the current validation operation. It is empty when `validateAll` is true, so the two should be used in conjunction. Useful for running custom validations only when particular values are being validated.
 
 
The function **must** call the callback with an object containing two attributes:
* `values`: the object of values, which may be unchanged or mutated by the validator function
* `errors`: the object of errors, which may be unchanged or mutated by the validator function

```javascript
function validateSquareNumberOfImages({ values, validateAll, valuePaths, errors }, callback){
  const { images } = values;

  if (validateAll || includes(valuePaths, 'images')) {
    if (isSquareNumber(images.length) ) {
      errors['images'] = 'Must select a square number of images';
    }
  }

  callback({ values, errors });
}
```
