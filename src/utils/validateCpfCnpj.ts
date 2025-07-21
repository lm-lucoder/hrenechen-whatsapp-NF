/**
 * Valida CPF ou CNPJ, reconhecendo automaticamente o tipo.
 * @param value string contendo CPF ou CNPJ
 * @returns { type: 'cpf' | 'cnpj' | 'invalid', valid: boolean }
 */
export function validateCpfCnpj(value: string): { type: 'cpf' | 'cnpj' | 'invalid', valid: boolean } {
  const clean = value.replace(/\D/g, '');
  const cpfRegex = /^(\d{3}\.?){2}\d{3}-?\d{2}$|^\d{11}$/;
  const cnpjRegex = /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$|^\d{14}$/;

  if (cpfRegex.test(value)) {
    return { type: 'cpf', valid: validateCPF(clean) };
  }
  if (cnpjRegex.test(value)) {
    return { type: 'cnpj', valid: validateCNPJ(clean) };
  }
  if (clean.length === 11) {
    return { type: 'cpf', valid: validateCPF(clean) };
  }
  if (clean.length === 14) {
    return { type: 'cnpj', valid: validateCNPJ(clean) };
  }
  return { type: 'invalid', valid: false };
}

function validateCPF(cpf: string): boolean {
  if (!cpf || cpf.length !== 11 || /^([0-9])\1+$/.test(cpf)) return false;
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(cpf.charAt(i)) * (10 - i);
  let firstCheck = (sum * 10) % 11;
  if (firstCheck === 10) firstCheck = 0;
  if (firstCheck !== parseInt(cpf.charAt(9))) return false;
  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(cpf.charAt(i)) * (11 - i);
  let secondCheck = (sum * 10) % 11;
  if (secondCheck === 10) secondCheck = 0;
  return secondCheck === parseInt(cpf.charAt(10));
}

function validateCNPJ(cnpj: string): boolean {
  if (!cnpj || cnpj.length !== 14 || /^([0-9])\1+$/.test(cnpj)) return false;
  let length = cnpj.length - 2;
  let numbers = cnpj.substring(0, length);
  let digits = cnpj.substring(length);
  let sum = 0;
  let pos = length - 7;
  for (let i = length; i >= 1; i--) {
    sum += parseInt(numbers.charAt(length - i)) * pos--;
    if (pos < 2) pos = 9;
  }
  let result = sum % 11 < 2 ? 0 : 11 - sum % 11;
  if (result !== parseInt(digits.charAt(0))) return false;
  length++;
  numbers = cnpj.substring(0, length);
  sum = 0;
  pos = length - 7;
  for (let i = length; i >= 1; i--) {
    sum += parseInt(numbers.charAt(length - i)) * pos--;
    if (pos < 2) pos = 9;
  }
  result = sum % 11 < 2 ? 0 : 11 - sum % 11;
  return result === parseInt(digits.charAt(1));
}
