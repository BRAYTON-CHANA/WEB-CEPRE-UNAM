const TECHNICAL_PATTERNS = [
  /^ID_/,
  /_(STORAGE_PATH|FILENAME|CONTENT_TYPE|MIMETYPE)$/i,
  /^(CREATED_AT|UPDATED_AT|DELETED_AT)$/i,
];

export const isTechnicalColumn = (name) =>
  TECHNICAL_PATTERNS.some((pattern) => pattern.test(name));

const formatLabel = (name) =>
  name
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

export const buildMergeFieldsFromSchema = (schema = {}, { exclude = [] } = {}) => {
  return Object.keys(schema)
    .filter((name) => !isTechnicalColumn(name) && !exclude.includes(name))
    .map((name) => ({ field: name, label: formatLabel(name) }));
};
