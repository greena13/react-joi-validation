import map from 'lodash.map';

import isNumberString from './isNumberString';

function pathFromSegments(pathSegments) {
  return map(pathSegments, (pathSegment) => {

    if (pathSegment === pathSegment[0]) {
      return pathSegment;
    } else {
      const isArrayIndex = isNumberString(pathSegment);

      if (isArrayIndex) {
        return `[${pathSegment}]`;
      } else {
        return `.${pathSegment}`;
      }
    }

  });
}

export default pathFromSegments;
