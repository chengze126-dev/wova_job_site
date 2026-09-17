export function passwordRules(password: string) {
  return {
    length: password.length >= 8 && password.length <= 64,
    letter: /[A-Za-z]/.test(password),
    number: /\d/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  };
}

export function isStrongPassword(password: string) {
  const rules = passwordRules(password);
  return rules.length && rules.letter && rules.number && rules.special;
}
