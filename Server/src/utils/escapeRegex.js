// Escapes regex special characters in user-typed search input before
// it's used to build a RegExp. Without this, someone searching for
// literal text containing e.g. "(", "*", or "+" would either get a
// regex syntax error (500) or unintended pattern-matching behavior.
export const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
