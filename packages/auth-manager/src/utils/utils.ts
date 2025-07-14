export function astrickStringComparatorLast(): (a: string, b: string) => 1 | -1 | 0 {
  return (a, b) => {
    const aHasAsterisk = a.includes('*');
    const bHasAsterisk = b.includes('*');

    if (aHasAsterisk && !bHasAsterisk) {
      return 1; // a comes after b
    } else if (!aHasAsterisk && bHasAsterisk) {
      return -1; // a comes before b
    } else {
      return 0; // maintain relative order if both have or don't have an asterisk
    }
  };
}
