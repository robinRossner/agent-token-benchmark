/**
 * Create a sequential id generator such as t_1, t_2, ...
 * @param {string} prefix id prefix, e.g. "t"
 * @param {number} [start] last used number
 * @returns {() => string}
 */
export function createIdGenerator(prefix, start = 0) {
  let counter = start;
  return () => {
    counter += 1;
    return `${prefix}_${counter}`;
  };
}

/**
 * Extract the numeric part of an id such as "t_42".
 * @param {string} id
 * @returns {number}
 */
export function idNumber(id) {
  const match = /_(\d+)$/.exec(id);
  return match ? Number(match[1]) : Number.NaN;
}
