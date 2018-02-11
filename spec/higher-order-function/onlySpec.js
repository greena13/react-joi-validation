import React from 'react';
import ShallowRenderer from 'react-test-renderer/shallow';
import validate from '../../react-joi-validation.development'
import Joi from 'joi-browser';

import expectComponentToHaveErrors from '../support/expectComponentToHaveErrors';
import expectComponentToHaveProps from '../support/expectComponentToHaveProps';
import refreshComponentState from '../support/refreshComponentState';

import WrappedComponent from '../WrappedComponent';

validate.setJoi(Joi);

describe('higher order function when the only option', () => {
  const usernameError = { username: 'must be a string' };
  const passwordError = { password: 'must be a string' };
  const passwordConfirmationError = { passwordConfirmation: 'is required' };

  const joiSchema = {
    username: Joi.string().required(),
    password: Joi.string().required(),
    passwordConfirmation: Joi.string().required()
  };

  beforeEach(function() {
    this.oldDefaultProps = WrappedComponent.defaultProps;

    this.refreshComponentState = refreshComponentState.bind(this);
    this.renderer = new ShallowRenderer();

    this.expectComponentToHaveProps = expectComponentToHaveProps.bind(this);
    this.expectComponentToHaveErrors = expectComponentToHaveErrors.bind(this);
  });

  afterEach(function() {
    WrappedComponent.defaultProps = this.oldDefaultProps;
  });

  describe('is not provided', () => {
    const ValidatedComponent = validate(WrappedComponent, { joiSchema });

    it('then correctly sets values from defaultValues', function(){
      WrappedComponent.defaultProps = {
        username: 'user1'
      };

      this.renderer.render(<ValidatedComponent />);

      this.refreshComponentState();

      this.expectComponentToHaveProps({ username: 'user1' });
    });

    it('then correctly sets values from props', function(){
      WrappedComponent.defaultProps = {
        username: 'user1',
        password: 'password1'
      };

      this.renderer.render(<ValidatedComponent username="user2"/>);
      this.refreshComponentState();

      this.expectComponentToHaveProps({ username: 'user2', password: 'password1' });
    });

    it('then correctly overrides default values', function(){
      WrappedComponent.defaultProps = {
        username: 'user1',
        password: 'password1'
      };

      this.renderer.render(<ValidatedComponent username="user2"/>);

      this.refreshComponentState();
      this.component.props.changeValue('username', 'user3');

      this.refreshComponentState();

      this.expectComponentToHaveProps({ username: 'user3', password: 'password1' });

      this.component.props.clearValidationAndResetValues();

      this.refreshComponentState();
      this.expectComponentToHaveProps({ username: 'user2', password: 'password1' });
    });

    it('then correctly sets errors', function(){
      this.renderer.render(<ValidatedComponent errors={ { username: 'already taken' }}/>);
      this.refreshComponentState();

      this.expectComponentToHaveErrors({ username: 'already taken' });

      this.component.props.changeValue('username', null, { validate: true });
      this.refreshComponentState();

      this.expectComponentToHaveErrors(usernameError);

      this.component.props.clearValidationAndResetValues();
      this.refreshComponentState();

      this.expectComponentToHaveErrors({ username: 'already taken' });
    });

    it('then correctly updates values and applies validation', function(){
      this.renderer.render(<ValidatedComponent />);

      this.refreshComponentState();

      this.expectComponentToHaveErrors({});

      this.component.props.changeValue('username', null, { validate: true });

      this.refreshComponentState();

      this.expectComponentToHaveErrors(usernameError);

      this.expectComponentToHaveProps({
        username: null
      });

      const changeHandler = this.component.props.changeHandler('password', { validate: 'password' });
      changeHandler(null, null);

      this.refreshComponentState();

      this.expectComponentToHaveErrors({ ...usernameError, ...passwordError });

      this.expectComponentToHaveProps({
        username: null,
        password: null
      });

      this.component.props.validateAll();

      this.refreshComponentState();

      this.expectComponentToHaveErrors({
        ...usernameError,
        ...passwordError,
        ...passwordConfirmationError
      });

      this.expectComponentToHaveProps({
        username: null,
        password: null
      });

      this.component.props.changeValue('username', 'user123', { validate: true });

      this.refreshComponentState();

      this.expectComponentToHaveErrors({
        ...passwordError,
        ...passwordConfirmationError
      });

      this.expectComponentToHaveProps({
        username: 'user123',
        password: null
      });

      const passwordChangeHandler = this.component.props.changeHandler('password', { value: 'password' });
      passwordChangeHandler();

      this.refreshComponentState();

      this.expectComponentToHaveErrors({
        ...passwordError,
        ...passwordConfirmationError
      });

      this.expectComponentToHaveProps({
        username: 'user123',
        password: 'password'
      });

      this.component.props.changeValues([['passwordConfirmation', 'password']], { validate: true });

      this.refreshComponentState();

      this.expectComponentToHaveErrors({});

      this.expectComponentToHaveProps({
        username: 'user123',
        password: 'password',
        passwordConfirmation: 'password'
      });

    });

  });

  describe('is a string and there are no other props', () => {
    const ValidatedComponent = validate(WrappedComponent, { joiSchema, only: 'user' });

    it('then correctly sets values from defaultValues', function(){
      WrappedComponent.defaultProps = {
        user: { username: 'user1' }
      };

      this.renderer.render(<ValidatedComponent />);

      this.refreshComponentState();

      this.expectComponentToHaveProps({ user: { username: 'user1' } });
    });

    it('then correctly sets values from props', function(){
      WrappedComponent.defaultProps = {
        user: {
          username: 'user1',
          password: 'password1'
        }
      };

      this.renderer.render(<ValidatedComponent user={{ username: 'user2' }}/>);
      this.refreshComponentState();

      this.expectComponentToHaveProps({ user: { username: 'user2', password: 'password1' } });
    });

    it('then correctly overrides default values', function(){
      WrappedComponent.defaultProps = {
        user: {
          username: 'user1',
          password: 'password1'
        }
      };

      this.renderer.render(<ValidatedComponent user={{ username: 'user2' }} />);

      this.refreshComponentState();
      this.component.props.changeValue('username', 'user3');

      this.refreshComponentState();

      this.expectComponentToHaveProps({ user: { username: 'user3', password: 'password1' } });

      this.component.props.clearValidationAndResetValues();

      this.refreshComponentState();
      this.expectComponentToHaveProps({ user: { username: 'user2', password: 'password1' } });
    });

    it('then correctly sets errors', function(){
      this.renderer.render(<ValidatedComponent errors={ { username: 'already taken' }}/>);
      this.refreshComponentState();

      this.expectComponentToHaveErrors({ username: 'already taken' });

      this.component.props.changeValue('username', null, { validate: true });
      this.refreshComponentState();

      this.expectComponentToHaveErrors(usernameError);

      this.component.props.clearValidationAndResetValues();
      this.refreshComponentState();

      this.expectComponentToHaveErrors({ username: 'already taken' });
    });

    it('then correctly updates values and applies validation', function(){
      this.renderer.render(<ValidatedComponent />);

      this.refreshComponentState();

      this.expectComponentToHaveErrors({});

      this.component.props.changeValue('username', null, { validate: true });

      this.refreshComponentState();

      this.expectComponentToHaveErrors(usernameError);

      this.expectComponentToHaveProps({
        user: {
          username: null
        }
      });

      const changeHandler = this.component.props.changeHandler('password', { validate: 'password' });
      changeHandler(null, null);

      this.refreshComponentState();

      this.expectComponentToHaveErrors({ ...usernameError, ...passwordError });

      this.expectComponentToHaveProps({
        user: {
          username: null,
          password: null
        }
      });

      this.component.props.validateAll();

      this.refreshComponentState();

      this.expectComponentToHaveErrors({ ...usernameError, ...passwordError, ...passwordConfirmationError });

      this.expectComponentToHaveProps({
        user: {
          username: null,
          password: null
        }
      });

      this.component.props.changeValue('username', 'user123', { validate: true });

      this.refreshComponentState();

      this.expectComponentToHaveErrors({ ...passwordError, ...passwordConfirmationError });

      this.expectComponentToHaveProps({
        user: {
          username: 'user123',
          password: null
        }
      });

      const passwordChangeHandler = this.component.props.changeHandler('password', { value: 'password' });
      passwordChangeHandler();

      this.refreshComponentState();

      this.expectComponentToHaveErrors({ ...passwordError, ...passwordConfirmationError });

      this.expectComponentToHaveProps({
        user: {
          username: 'user123',
          password: 'password'
        }
      });

      this.component.props.changeValues([['passwordConfirmation', 'password']], { validate: true });

      this.refreshComponentState();

      this.expectComponentToHaveErrors({});

      this.expectComponentToHaveProps({
        user: {
          username: 'user123',
          password: 'password',
          passwordConfirmation: 'password'
        }
      });

    });

  });

  describe('is a string and there are other props not being validated', () => {
    const ValidatedComponent = validate(WrappedComponent, { joiSchema, only: 'user' });

    it('then correctly sets values from defaultValues', function(){
      WrappedComponent.defaultProps = {
        user: { username: 'user1' }, address: { city: '' }
      };

      this.renderer.render(<ValidatedComponent />);

      this.refreshComponentState();

      this.expectComponentToHaveProps({
        user: { username: 'user1' },
        address: { city: '' }
      });

    });

    it('then correctly sets values from props', function(){
      WrappedComponent.defaultProps = {
        user: {
          username: 'user1',
          password: 'password1'
        },
        address: { city: '' }
      };

      this.renderer.render(<ValidatedComponent user={{ username: 'user2' }} address={ { city: 'New York City' } }/>);
      this.refreshComponentState();

      this.expectComponentToHaveProps({
        user: { username: 'user2', password: 'password1' },
        address: { city: 'New York City' }
      });
    });

    it('then correctly passes down other props that don\'t have a default value', function(){
      WrappedComponent.defaultProps = {
        user: {
          username: 'user1',
          password: 'password1'
        },
      };

      this.renderer.render(<ValidatedComponent user={{ username: 'user2' }} address={ { city: 'New York City' } }/>);
      this.refreshComponentState();

      this.expectComponentToHaveProps({
        user: { username: 'user2', password: 'password1' },
        address: { city: 'New York City' }
      });
    });

    it('then correctly overrides default values', function(){
      WrappedComponent.defaultProps = {
        user: {
          username: 'user1',
          password: 'password1'
        },
        address: { city: '' }
      };

      this.renderer.render(<ValidatedComponent user={{ username: 'user2' }} />);

      this.refreshComponentState();
      this.component.props.changeValue('username', 'user3');

      this.refreshComponentState();

      this.expectComponentToHaveProps({
        user: { username: 'user3', password: 'password1' },
        address: { city: '' }
      });

      this.component.props.clearValidationAndResetValues();

      this.refreshComponentState();
      this.expectComponentToHaveProps({
        user: { username: 'user2', password: 'password1' },
        address: { city: '' }
      });
    });

    it('then correctly sets errors', function(){
      this.renderer.render(<ValidatedComponent address={ { city: 'New York City' } } errors={ { username: 'already taken' }}/>);
      this.refreshComponentState();

      this.expectComponentToHaveErrors({ username: 'already taken' });

      this.component.props.changeValue('username', null, { validate: true });
      this.refreshComponentState();

      this.expectComponentToHaveErrors(usernameError);

      this.expectComponentToHaveProps({
        address: { city: 'New York City' },
        user: { username: null }
      });

      this.component.props.clearValidationAndResetValues();
      this.refreshComponentState();

      this.expectComponentToHaveErrors({ username: 'already taken' });

      this.expectComponentToHaveProps({
        user: {},
        address: { city: 'New York City' }
      });
    });

    it('then correctly updates values and applies validation', function(){
      this.renderer.render(<ValidatedComponent address={ { city: 'New York City' } }/>);

      this.refreshComponentState();

      this.expectComponentToHaveErrors({});

      this.component.props.changeValue('username', null, { validate: true });

      this.refreshComponentState();

      this.expectComponentToHaveErrors(usernameError);

      this.expectComponentToHaveProps({
        user: {
          username: null
        },
        address: { city: 'New York City' }
      });

      const changeHandler = this.component.props.changeHandler('password', { validate: 'password' });
      changeHandler(null, null);

      this.refreshComponentState();

      this.expectComponentToHaveErrors({ ...usernameError, ...passwordError });

      this.expectComponentToHaveProps({
        user: {
          username: null,
          password: null
        },
        address: { city: 'New York City' }
      });

      this.component.props.validateAll();

      this.refreshComponentState();

      this.expectComponentToHaveErrors({ ...usernameError, ...passwordError, ...passwordConfirmationError });

      this.expectComponentToHaveProps({
        user: {
          username: null,
          password: null
        },
        address: { city: 'New York City' }
      });

      this.component.props.changeValue('username', 'user123', { validate: true });

      this.refreshComponentState();

      this.expectComponentToHaveErrors({ ...passwordError, ...passwordConfirmationError });

      this.expectComponentToHaveProps({
        user: {
          username: 'user123',
          password: null
        },
        address: { city: 'New York City' }
      });

      const passwordChangeHandler = this.component.props.changeHandler('password', { value: 'password' });
      passwordChangeHandler();

      this.refreshComponentState();

      this.expectComponentToHaveErrors({ ...passwordError, ...passwordConfirmationError });

      this.expectComponentToHaveProps({
        user: {
          username: 'user123',
          password: 'password'
        },
        address: { city: 'New York City' }
      });

      this.component.props.changeValues([['passwordConfirmation', 'password']], { validate: true });

      this.refreshComponentState();

      this.expectComponentToHaveErrors({});

      this.expectComponentToHaveProps({
        user: {
          username: 'user123',
          password: 'password',
          passwordConfirmation: 'password'
        },
        address: { city: 'New York City' }
      });

    });

  });

  describe('is a string containing a complicated path', () => {
    const ValidatedComponent = validate(WrappedComponent, { joiSchema, only: 'user.details' });

    beforeEach(function() {
      this.renderer = new ShallowRenderer();

      this.refreshComponentState = refreshComponentState.bind(this);
      this.expectComponentToHaveProps = expectComponentToHaveProps.bind(this);
      this.expectComponentToHaveErrors = expectComponentToHaveErrors.bind(this);
    });

    it('then correctly sets values from defaultValues', function(){
      WrappedComponent.defaultProps = {
        user: {
          details: { username: 'user1' },
          friendIds: [],
        },
        day: 'Monday'
      };

      this.renderer.render(<ValidatedComponent />);

      this.refreshComponentState();

      this.expectComponentToHaveProps({
        user: {
          details: { username: 'user1' },
          /**
           * Don't include friendIds as it's not managed by react-joi-validation
           * and as React itself doesn't merge nested default prop values into those
           * that are passed to the component, we don't want to change or undermine
           * this behaviour.
           */
        },
        day: 'Monday',
      });
    });

    it('then correctly sets values from props', function(){
      WrappedComponent.defaultProps = {
        user: {
          details: {
            username: 'user1',
            password: 'password1'
          }
        }
      };

      this.renderer.render(
        <ValidatedComponent
          user={ { details: { username: 'user2' }, friendIds: [1] } }
          year={ 2020 }
        />
      );

      this.refreshComponentState();

      this.expectComponentToHaveProps({
        user: {
          details: { username: 'user2', password: 'password1' },
          friendIds: [1],
        },
        year: 2020,
      });
    });

    it('then correctly overrides default values', function(){
      WrappedComponent.defaultProps = {
        user: {
          details: {
            username: 'user1',
            password: 'password1'
          },
          friendIds: [],
        },
        day: 'Monday'
      };

      this.renderer.render(
        <ValidatedComponent
          user={ { details: { username: 'user2' }, friendIds: [1] } }
          day='Tuesday'
        />);

      this.refreshComponentState();
      this.component.props.changeValue('username', 'user3');

      this.refreshComponentState();

      this.expectComponentToHaveProps({
        user: {
          details: { username: 'user3', password: 'password1' },
          friendIds: [1]
        },
        day: 'Tuesday'
      });

      this.component.props.clearValidationAndResetValues();

      this.refreshComponentState();

      this.expectComponentToHaveProps({
        user: {
          details: { username: 'user2', password: 'password1' },
          friendIds: [1],
        },
        day: 'Tuesday'
      });
    });

    it('then correctly sets errors', function(){
      this.renderer.render(<ValidatedComponent errors={ { username: 'already taken' }}/>);
      this.refreshComponentState();

      this.expectComponentToHaveErrors({ username: 'already taken' });

      this.component.props.changeValue('username', null, { validate: true });
      this.refreshComponentState();

      this.expectComponentToHaveErrors(usernameError);

      this.component.props.clearValidationAndResetValues();
      this.refreshComponentState();

      this.expectComponentToHaveErrors({ username: 'already taken' });
    });

    it('then correctly updates values and applies validation', function(){
      this.renderer.render(<ValidatedComponent />);

      this.refreshComponentState();

      this.expectComponentToHaveErrors({});

      this.component.props.changeValue('username', null, { validate: true });

      this.refreshComponentState();

      this.expectComponentToHaveErrors(usernameError);

      this.expectComponentToHaveProps({
        user: { details: {
          username: null
        } }
      });

      const changeHandler = this.component.props.changeHandler('password', { validate: 'password' });
      changeHandler(null, null);

      this.refreshComponentState();

      this.expectComponentToHaveErrors({ ...usernameError, ...passwordError });

      this.expectComponentToHaveProps({
        user: { details: {
          username: null,
          password: null
        } }
      });

      this.component.props.validateAll();

      this.refreshComponentState();

      this.expectComponentToHaveErrors({ ...usernameError, ...passwordError, ...passwordConfirmationError });

      this.expectComponentToHaveProps({
        user: { details: {
          username: null,
          password: null
        } }
      });

      this.component.props.changeValue('username', 'user123', { validate: true });

      this.refreshComponentState();

      this.expectComponentToHaveErrors({ ...passwordError, ...passwordConfirmationError });

      this.expectComponentToHaveProps({
        user: { details: {
          username: 'user123',
          password: null
        } }
      });

      const passwordChangeHandler = this.component.props.changeHandler('password', { value: 'password' });
      passwordChangeHandler();

      this.refreshComponentState();

      this.expectComponentToHaveErrors({ ...passwordError, ...passwordConfirmationError });

      this.expectComponentToHaveProps({
        user: { details: {
          username: 'user123',
          password: 'password'
        } }
      });

      this.component.props.changeValues([['passwordConfirmation', 'password']], { validate: true });

      this.refreshComponentState();

      this.expectComponentToHaveErrors({});

      this.expectComponentToHaveProps({
        user: { details: {
          username: 'user123',
          password: 'password',
          passwordConfirmation: 'password'
        } }
      });

    });

  });

  describe('is an array with one element', () => {
    const ValidatedComponent = validate(WrappedComponent, { joiSchema: { user: joiSchema }, only: ['user'] });

    beforeEach(function() {
      this.renderer = new ShallowRenderer();

      this.refreshComponentState = refreshComponentState.bind(this);
      this.expectComponentToHaveProps = expectComponentToHaveProps.bind(this);
      this.expectComponentToHaveErrors = expectComponentToHaveErrors.bind(this);
    });

    it('then correctly sets values from defaultValues', function(){
      WrappedComponent.defaultProps = {
        user: { username: 'user1' }
      };

      this.renderer.render(<ValidatedComponent />);

      this.refreshComponentState();

      this.expectComponentToHaveProps({ user: { username: 'user1' } });
    });

    it('then correctly sets values from props', function(){
      WrappedComponent.defaultProps = {
        user: {
          username: 'user1',
          password: 'password1'
        }
      };

      this.renderer.render(<ValidatedComponent user={{ username: 'user2' }}/>);
      this.refreshComponentState();

      this.expectComponentToHaveProps({ user: { username: 'user2', password: 'password1' } });
    });

    it('then correctly overrides default values', function(){
      WrappedComponent.defaultProps = {
        user: {
          username: 'user1',
          password: 'password1'
        }
      };

      this.renderer.render(<ValidatedComponent user={{ username: 'user2' }} />);

      this.refreshComponentState();
      this.component.props.changeValue('user.username', 'user3');

      this.refreshComponentState();

      this.expectComponentToHaveProps({ user: { username: 'user3', password: 'password1' } });

      this.component.props.clearValidationAndResetValues();

      this.refreshComponentState();
      this.expectComponentToHaveProps({ user: { username: 'user2', password: 'password1' } });
    });

    it('then correctly sets errors', function(){
      this.renderer.render(<ValidatedComponent errors={ { user: { username: 'already taken' } }}/>);
      this.refreshComponentState();

      this.expectComponentToHaveErrors({ user: { username: 'already taken' } });

      this.component.props.changeValue('user.username', null, { validate: true });
      this.refreshComponentState();

      this.expectComponentToHaveErrors({ user: usernameError });

      this.component.props.clearValidationAndResetValues();
      this.refreshComponentState();

      this.expectComponentToHaveErrors({ user: { username: 'already taken' } });
    });

    it('then correctly updates values and applies validation', function(){
      this.renderer.render(<ValidatedComponent />);

      this.refreshComponentState();

      this.expectComponentToHaveErrors({});

      this.component.props.changeValue('user.username', null, { validate: true });

      this.refreshComponentState();

      this.expectComponentToHaveErrors({ user: usernameError });

      this.expectComponentToHaveProps({
        user: {
          username: null
        }
      });

      const changeHandler = this.component.props.changeHandler('user.password', { validate: 'user.password' });
      changeHandler(null, null);

      this.refreshComponentState();

      this.expectComponentToHaveErrors({ user: { ...usernameError, ...passwordError } });

      this.expectComponentToHaveProps({
        user: {
          username: null,
          password: null
        }
      });

      this.component.props.validateAll();

      this.refreshComponentState();

      this.expectComponentToHaveErrors({ user: { ...usernameError, ...passwordError, ...passwordConfirmationError } });

      this.expectComponentToHaveProps({
        user: {
          username: null,
          password: null
        }
      });

      this.component.props.changeValue('user.username', 'user123', { validate: true });

      this.refreshComponentState();

      this.expectComponentToHaveErrors({ user: { ...passwordError, ...passwordConfirmationError } });

      this.expectComponentToHaveProps({
        user: {
          username: 'user123',
          password: null
        }
      });

      const passwordChangeHandler = this.component.props.changeHandler('user.password', { value: 'password' });
      passwordChangeHandler();

      this.refreshComponentState();

      this.expectComponentToHaveErrors({ user: { ...passwordError, ...passwordConfirmationError } });

      this.expectComponentToHaveProps({
        user: {
          username: 'user123',
          password: 'password'
        }
      });

      this.component.props.changeValues([['user.passwordConfirmation', 'password']], { validate: true });

      this.refreshComponentState();

      this.expectComponentToHaveErrors({});

      this.expectComponentToHaveProps({
        user: {
          username: 'user123',
          password: 'password',
          passwordConfirmation: 'password'
        }
      });

    });

  });

  describe('is an array with multiple paths', () => {
    const fullSchema = {
      user: joiSchema,
      profile: {
        age: Joi.number().required()
      }
    };

    const ageError = { age: 'must be a number' };

    const ValidatedComponent = validate(WrappedComponent, { joiSchema: fullSchema, only: ['user', 'profile'] });

    it('then correctly sets values from defaultValues', function(){
      WrappedComponent.defaultProps = {
        user: { username: 'user1' },
        profile: { age: 18 }
      };

      this.renderer.render(<ValidatedComponent />);

      this.refreshComponentState();

      this.expectComponentToHaveProps({ user: { username: 'user1' }, profile: { age: 18 } });
    });

    it('then correctly sets values from props', function(){
      WrappedComponent.defaultProps = {
        user: {
          username: 'user1',
          password: 'password1'
        },
        profile: { age: 18 }
      };

      this.renderer.render(<ValidatedComponent user={{ username: 'user2' }} profile={{ age: 21 }}/>);
      this.refreshComponentState();

      this.expectComponentToHaveProps({
        user: { username: 'user2', password: 'password1' },
        profile: { age: 21 }
      });
    });

    it('then correctly overrides default values', function(){
      WrappedComponent.defaultProps = {
        user: {
          username: 'user1',
          password: 'password1'
        },
        profile: { age: 18 }
      };

      this.renderer.render(<ValidatedComponent user={{ username: 'user2' }} profile={{ age: 21 }}/>);

      this.refreshComponentState();
      this.component.props.changeValue('user.username', 'user3');
      this.component.props.changeValue('profile.age', 23 );

      this.refreshComponentState();

      this.expectComponentToHaveProps({
        user: { username: 'user3', password: 'password1' },
        profile: { age: 23 }
      });

      this.component.props.clearValidationAndResetValues();

      this.refreshComponentState();

      this.expectComponentToHaveProps({
        user: { username: 'user2', password: 'password1' },
        profile: { age: 21 }
      });
    });

    it('then correctly sets errors', function(){
      this.renderer.render(<ValidatedComponent errors={ { user: { username: 'already taken' }, profile: { age: 'too young' } }}/>);
      this.refreshComponentState();

      this.expectComponentToHaveErrors({
          user: { username: 'already taken' },
          profile: { age: 'too young' }
        }
      );

      this.component.props.changeValue('user.username', null, { validate: true });
      this.component.props.changeValue('profile.age', null, { validate: true });

      this.refreshComponentState();

      this.expectComponentToHaveErrors({
        user: usernameError,
        profile: ageError
      });

      this.component.props.clearValidationAndResetValues();
      this.refreshComponentState();

      this.expectComponentToHaveErrors({
          user: { username: 'already taken' },
          profile: { age: 'too young' }
        }
      );
    });

    it('then correctly updates values and applies validation', function(){
      this.renderer.render(<ValidatedComponent />);

      this.refreshComponentState();

      this.expectComponentToHaveErrors({});

      this.component.props.changeValue('user.username', null, { validate: true });

      this.refreshComponentState();

      this.expectComponentToHaveErrors({ user: usernameError });

      this.expectComponentToHaveProps({
        user: {
          username: null
        }
      });

      const changeHandler = this.component.props.changeHandler('profile.age', { validate: 'profile.age' });
      changeHandler(null, null);

      this.refreshComponentState();

      this.expectComponentToHaveErrors({
        user: usernameError,
        profile: ageError
      });

      this.expectComponentToHaveProps({
        user: { username: null },
        profile: { age: null }
      });

      this.component.props.validateAll();

      this.refreshComponentState();

      this.expectComponentToHaveErrors({
        user: {
          ...usernameError,
          password: 'is required',
          passwordConfirmation: 'is required'
        },
        profile: ageError
      });

      this.expectComponentToHaveProps({
        user: {
          username: null
        },
        profile: { age: null }
      });

      this.component.props.changeValue('user.username', 'user123', { validate: true });

      this.refreshComponentState();

      this.expectComponentToHaveErrors({
        user: {
          password: 'is required',
          passwordConfirmation: 'is required'
        },
        profile: ageError
      });

      this.expectComponentToHaveProps({
        user: {
          username: 'user123'
        },
        profile: { age: null }
      });

      const passwordChangeHandler = this.component.props.changeHandler('user.password', { value: 'password' });
      passwordChangeHandler();

      this.refreshComponentState();

      this.expectComponentToHaveErrors({
        user: {
          password: 'is required',
          passwordConfirmation: 'is required'
        },
        profile: ageError
      });

      this.expectComponentToHaveProps({
        user: {
          username: 'user123',
          password: 'password'
        },
        profile: { age: null }
      });

      this.component.props.changeValues([['user.passwordConfirmation', 'password'], ['profile.age', 21] ], { validate: true });

      this.refreshComponentState();

      this.expectComponentToHaveErrors({});

      this.expectComponentToHaveProps({
        user: {
          username: 'user123',
          password: 'password',
          passwordConfirmation: 'password'
        },
        profile: { age: 21 }
      });

    });

  });

 });
