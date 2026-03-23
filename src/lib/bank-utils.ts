export const banks = [
  { name: "Nubank", keywords: ["nubank"], color: "#820AD1" },
  { name: "Inter", keywords: ["inter", "banco inter"], color: "#FF7A00" },
  { name: "Bradesco", keywords: ["bradesco"], color: "#CC092F" },
  { name: "Itaú", keywords: ["itau", "itaú"], color: "#EC7000" },
  { name: "Santander", keywords: ["santander"], color: "#EC0000" },
  { name: "Caixa", keywords: ["caixa"], color: "#0065A4" },
  { name: "Banco do Brasil", keywords: ["banco do brasil", "bb"], color: "#0033A0" },
  { name: "C6 Bank", keywords: ["c6"], color: "#2C2C2C" },
  { name: "PicPay", keywords: ["picpay"], color: "#21C25E" },
  { name: "Mercado Pago", keywords: ["mercado pago"], color: "#00B1EA" },
];

export function getBank(name: string) {
  const lowerCaseName = name.toLowerCase();
  return banks.find(bank => bank.keywords.some(kw => lowerCaseName.includes(kw)));
}
