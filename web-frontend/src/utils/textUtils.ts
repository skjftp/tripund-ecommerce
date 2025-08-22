/**
 * Convert text to proper case (Title Case)
 * @param text - The text to convert
 * @returns The text in proper case
 */
export function toProperCase(text: string): string {
  if (!text) return '';
  
  // Words that should remain lowercase unless at the beginning
  const exceptions = ['a', 'an', 'and', 'as', 'at', 'but', 'by', 'for', 'from',
    'in', 'into', 'nor', 'of', 'on', 'or', 'the', 'to', 'with'];
  
  return text
    .toLowerCase()
    .split(' ')
    .map((word, index) => {
      // Always capitalize first word or words not in exceptions
      if (index === 0 || !exceptions.includes(word)) {
        return word.charAt(0).toUpperCase() + word.slice(1);
      }
      return word;
    })
    .join(' ');
}

/**
 * Convert text to sentence case
 * @param text - The text to convert
 * @returns The text in sentence case
 */
export function toSentenceCase(text: string): string {
  if (!text) return '';
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}