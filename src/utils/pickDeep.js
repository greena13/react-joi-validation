import get from 'lodash.get';
import set from 'lodash.set';
import reduce from 'lodash.reduce';

export default function(source, paths) {
  return reduce(paths, (memo, path) => {

    const sourceValue = get(source, path);
    set(memo, path, sourceValue);

    return memo;
  }, {});
}
