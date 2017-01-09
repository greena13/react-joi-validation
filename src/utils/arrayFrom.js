export default function(target) {
  if (target) {

    if (Array.isArray(target)) {
      return target;
    } else {
      return [ target ];
    }

  } else {
    return [];
  }
}
