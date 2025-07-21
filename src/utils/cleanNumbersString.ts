export default function cleanNumbersString(input: string): string {
  return input.replace(/\D/g, '').replaceAll(".", "").replaceAll("-", "");
}
