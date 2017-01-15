import toPath from 'lodash.topath';
import get from 'lodash.get';
import set from 'lodash.set';
import isString from 'lodash.isstring';

import isNumberString from './isNumberString';

function extendAnyTouchedAncestors(target, path, indicator) {
  const pathSegments = toPath(path);

  const ancestorPathSegments = touchedAncestorPathSegments(target, pathSegments);

  if (ancestorPathSegments) {

    const newPathNode = function(){
      const nextPathSegment = pathSegments[ancestorPathSegments.length];

      if (isNumberString(nextPathSegment)) {
        return [];
      } else {
        return {};
      }
    }();

    newPathNode[indicator] = indicator;

    set(target, ancestorPathSegments, newPathNode);
  }
}

function touchedAncestorPathSegments(target, pathSegments) {

  let index = 0;

  while( index <= pathSegments.length) {
    const thisPathSegments = pathSegments.slice(0, index + 1);

    const thisValue = get(target, thisPathSegments);

    if (isString(thisValue)) {
      return thisPathSegments;
    }

    index++;
  }
}

export default extendAnyTouchedAncestors;
