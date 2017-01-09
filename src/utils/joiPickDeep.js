import set from 'lodash.set';
import reduce from 'lodash.reduce';
import isPlainObject from 'lodash.isplainobject';

import pickDeep from './pickDeep';

export default function(joi, completeSchema, valuePaths) {

  if (isPlainObject(completeSchema)) {
    return pickDeep(completeSchema, valuePaths);
  } else {
    return reduce(valuePaths, (schemas, valuePath) => {
      set(schemas, valuePath, joi.reach(completeSchema, valuePath));
      return schemas;
    }, {});
  }

}
