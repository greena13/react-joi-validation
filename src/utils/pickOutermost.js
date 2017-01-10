import isPlainObject from 'lodash.isplainobject';
import each from 'lodash.foreach';

function pickOutermost(target, list = []) {

  if (isPlainObject(target)) {

    each(target, (subValue) => {
      pickOutermost(subValue, list);
    });

  } else if (Array.isArray(target)) {

    each(target, (element) => {
      pickOutermost(element, list);
    });

  } else {

    list.push(target);

  }

  return list;
}

export default pickOutermost;
