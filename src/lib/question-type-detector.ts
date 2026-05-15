
import { allFields } from '@/data/formFields';

const isNumeric = (value: unknown) => {
  if (value === null || value === '') return false;
  return !isNaN(Number(value));
};

const getUniqueValues = (data: Array<Record<string, unknown>>, column: string) => {
  const values = data.map(row => row[column]).filter(value => value !== null && value !== undefined && value !== '');
  return [...new Set(values)];
};

export const detectQuestionType = (column: string, data: Array<Record<string, unknown>>): string => {
  const uniqueValues = getUniqueValues(data, column);
  const totalRows = data.length;
  const uniqueCount = uniqueValues.length;

  // Heuristic 1: Numeric values
  if (uniqueValues.every(isNumeric)) {
    // If all unique values are numbers
    if (uniqueCount <= 5) {
      // Small number of unique numeric values -> Rating or Radio
      const numbers = uniqueValues.map(Number);
      if (Math.max(...numbers) <= 10 && Math.min(...numbers) >= 0) {
        return 'rating'; // e.g., 1, 2, 3, 4, 5
      }
    }
    if (uniqueCount > 5) {
        return 'number'; // Many different numbers
    }
  }

  // Heuristic 2: Categorical values (Multiple Choice / Select)
  if (uniqueCount <= 7 && uniqueCount > 1) {
    // If there's a small number of unique text values, it's likely a multiple choice question
    const averageLength = uniqueValues.reduce((acc, val) => acc + String(val).length, 0) / uniqueCount;
    if (averageLength < 50) { // Avoid classifying long text as multiple choice
      return 'radio';
    }
  }

  // Heuristic 3: Open-ended text
  if (uniqueCount / totalRows > 0.8) {
    const averageLength = uniqueValues.reduce((acc, val) => acc + String(val).length, 0) / uniqueCount;
    if (averageLength > 100) {
      return 'textarea'; // Many unique values with long text
    }
    return 'text'; // Many unique values with short text
  }
  
  // Heuristic 4: Checkbox (multiple values in one cell)
  const hasMultipleValues = data.some(row => String(row[column]).includes(',') || String(row[column]).includes(';'));
  if (hasMultipleValues) {
    return 'checkbox';
  }

  // Default fallback
  return 'text';
};

export const autoDetectColumnTypes = (sheetData: Array<Record<string, unknown>>): { [key: string]: string } => {
  if (sheetData.length === 0) {
    return {};
  }

  const headers = Object.keys(sheetData[0]);
  const detectedTypes: { [key: string]: string } = {};

  for (const header of headers) {
    detectedTypes[header] = detectQuestionType(header, sheetData);
  }

  return detectedTypes;
};
