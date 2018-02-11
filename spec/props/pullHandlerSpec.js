import React from 'react';
import ShallowRenderer from 'react-test-renderer/shallow';
import validate from '../../react-joi-validation.development';

import Joi from 'joi-browser';

import refreshComponentState from '../support/refreshComponentState';

import WrappedComponent from '../WrappedComponent';

validate.setJoi(Joi);

describe('pullHandler', () => {
  const joiSchema = {
    a: Joi.array().min(2).required()
  };

  beforeEach(function () {
    this.oldDefaultProps = WrappedComponent.defaultProps;

    this.refreshComponentState = refreshComponentState.bind(this);
    this.renderer = new ShallowRenderer();

    this.ValidatedComponent = validate(WrappedComponent, { joiSchema });

    this.renderer.render(<this.ValidatedComponent />);
    this.refreshComponentState();
  });

  afterEach(function() {
    WrappedComponent.defaultProps = this.oldDefaultProps;
  });

  describe('when used with a string path', () => {
    it('then returns a function that removes the attribute from the path referenced by the string when it is called', function(){
      const changeHandler = this.component.props.changeHandler('a');
      const pullHandler = this.component.props.pullHandler('a');

      changeHandler(null, [1,2,3,1]);
      this.refreshComponentState();
      expect(this.component.props.a).toEqual([1,2,3,1]);

      pullHandler(null, 1);
      this.refreshComponentState();
      expect(this.component.props.a).toEqual([2,3,1]);

      pullHandler(null, 1);
      this.refreshComponentState();
      expect(this.component.props.a).toEqual([2,3]);
    });
  });

  describe('when used with an index argument', () => {
    it('then returns a function that omits the value at that index each time it\'s called', function(){
      const changeHandler = this.component.props.changeHandler('a');
      const pullHandler = this.component.props.pullHandler('a', { index: 1 });

      changeHandler(null, [1,2,3,1]);
      this.refreshComponentState();
      expect(this.component.props.a).toEqual([1,2,3,1]);

      pullHandler(null, 1);
      this.refreshComponentState();
      expect(this.component.props.a).toEqual([1,3,1]);

      pullHandler(null, 1);
      this.refreshComponentState();
      expect(this.component.props.a).toEqual([1,1]);

      pullHandler(null, 1);
      this.refreshComponentState();
      expect(this.component.props.a).toEqual([1]);

      pullHandler(null, 1);
      this.refreshComponentState();
      expect(this.component.props.a).toEqual([1]);

    });
  });

  describe('when used with the removeAllInstances option', () => {
    it('then returns a function that omits all instances of a value from the attribute each time it is called', function(){
      const changeHandler = this.component.props.changeHandler('a');
      const pullHandler = this.component.props.pullHandler('a', { removeAllInstances: true });

      changeHandler(null, [1,2,3,1]);
      this.refreshComponentState();
      expect(this.component.props.a).toEqual([1,2,3,1]);

      pullHandler(null, 1);
      this.refreshComponentState();
      expect(this.component.props.a).toEqual([2,3]);
    });
  });

});
