import omit from 'lodash.omit';

function expectComponentToHaveProps(values) {
  const reactJoiValidationProps = [
    'changeHandler',
    'changesHandler',
    'changeValue',
    'changeValues',
    'validateHandler',
    'validate',
    'validateAllHandler',
    'validateAll',
    'clearValidation',
    'clearValidationState',
    'clearValidationAndResetValues',
    'clearValidationTouchedValues',
    'errors'
  ];

  expect(omit(this.component.props, reactJoiValidationProps)).toEqual(values);
}

export default expectComponentToHaveProps;
