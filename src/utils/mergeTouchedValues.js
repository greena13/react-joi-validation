import toPath from 'lodash.topath';
import get from 'lodash.get';
import set from 'lodash.set';
import isString from 'lodash.isstring';
import reduce from 'lodash.reduce';
import deepClone from 'lodash.clonedeep';

import isNumberString from './isNumberString';
import Wildcard from '../constants/Wildcard';

function extendAnyTouchedAncestors(target, path) {
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

    newPathNode[Wildcard] = Wildcard;

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

function mergeTouchedValues(newTouchedValuePaths, previouslyTouchedValues) {

  return reduce(newTouchedValuePaths, (updatedTouchedValues, path)=>{

    if (path !== Wildcard) {

      extendAnyTouchedAncestors(updatedTouchedValues, path);

      set(updatedTouchedValues, path, path);
    }

    return updatedTouchedValues;
  }, deepClone(previouslyTouchedValues));
}

export default mergeTouchedValues;
