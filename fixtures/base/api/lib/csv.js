/**
 * Quote a single CSV cell when it contains separators, quotes or newlines.
 * @param {unknown} value
 * @returns {string}
 */
export function csvCell(value) {
  const text = value === null || value === undefined ? '' : String(value);
  return /[",\n\r]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

/**
 * Serialise rows of objects to CSV text with a header line.
 * @param {object[]} rows
 * @param {string[]} columns property names, in output order
 * @returns {string}
 */
export function toCsv(rows, columns) {
  const lines = [columns.join(',')];
  for (const row of rows) lines.push(columns.map((column) => csvCell(row[column])).join(','));
  return `${lines.join('\n')}\n`;
}
