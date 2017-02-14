function expectComponentToHaveErrors(errors) {
  expect(this.component.props.errors).toEqual(errors);
}

export default expectComponentToHaveErrors;
