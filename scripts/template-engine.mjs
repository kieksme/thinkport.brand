/**
 * Simple template engine used for HTML/TXT templates
 *
 * Supports:
 * - {{variable}} placeholders
 * - {{#if variable}}...{{/if}} blocks
 */

/**
 * Render a template string with the given data.
 * @param {string} template
 * @param {Record<string, any>} data
 * @returns {string}
 */
export function renderTemplate(template, data) {
  let result = template;

  // Handle conditionals {{#if variable}}...{{/if}}
  const conditionalRegex = /\{\{#if\s+(\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g;
  result = result.replace(conditionalRegex, (match, variable, content) => {
    if (data[variable] && data[variable].toString().trim() !== '') {
      return content;
    }
    return '';
  });

  // Replace simple placeholders {{variable}}
  const placeholderRegex = /\{\{(\w+)\}\}/g;
  result = result.replace(placeholderRegex, (match, variable) => {
    return data[variable] != null ? String(data[variable]) : '';
  });

  return result;
}

