import isUndefined from 'lodash.isundefined';
import isPlainObject from 'lodash.isplainobject';
import isString from 'lodash.isstring';

import unique from 'lodash.uniq';
import keys from 'lodash.keys';
import reduce from 'lodash.reduce';
import map from 'lodash.map';

import Wildcard from '../constants/Wildcard';

function valueAlreadyTouched(value) {
  return isString(value) || value && value[Wildcard];
}

function valuesWithDefaultsAndExemptions({ deepMergeExemptions = {}, overrides, defaultValue }) {

  if (valueAlreadyTouched(deepMergeExemptions) || isUndefined(defaultValue)) {

    return overrides;

  } else {

    if (isUndefined(overrides)) {

      return defaultValue;

    } else {

      if (isPlainObject(overrides)) {

        const unionOfObjectKeys = unique([
          ...keys(defaultValue),
          ...keys(overrides)
        ]);

        return reduce(unionOfObjectKeys, (memo, key) => {

          if (valueAlreadyTouched(deepMergeExemptions[key])) {

            memo[key] = overrides[key];

          } else {

            memo[key] = valuesWithDefaultsAndExemptions({
              defaultValue: defaultValue[key],
              overrides: overrides[key],
              deepMergeExemptions: deepMergeExemptions[key]
            });

          }

          return memo;

        }, {});

      } else if (Array.isArray(overrides)) {

        const overridesIsLongerThanDefault = overrides.length > defaultValue.length;

        if (overridesIsLongerThanDefault) {

          return map(overrides, (overrideElement, index) => {

            if (valueAlreadyTouched(deepMergeExemptions[index])) {

              return overrideElement;

            } else {

              return valuesWithDefaultsAndExemptions({
                defaultValue: defaultValue[index],
                overrides: overrideElement,
                deepMergeExemptions: deepMergeExemptions[index]
              });

            }

          });

        } else {

          return map(defaultValue, (defaultValueElement, index) => {

            if (valueAlreadyTouched(deepMergeExemptions[index])) {

              return overrides[index];

            } else {

              return valuesWithDefaultsAndExemptions({
                defaultValue: defaultValueElement,
                overrides: overrides[index],
                deepMergeExemptions: deepMergeExemptions[index]
              });
            }

          });
        }

      } else {

        return overrides;

      }
    }

  }
}

export default valuesWithDefaultsAndExemptions;
