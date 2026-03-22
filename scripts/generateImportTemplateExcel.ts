import ExcelJS from "exceljs";
import path from "path";
import fs from "fs/promises";

export async function generateImportTemplateExcel(destPath: string) {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Importação FinFlow Pro");

  ws.columns = [
    { header: "Data", key: "date", width: 15 },
    { header: "Descrição", key: "description", width: 30 },
    { header: "Categoria", key: "category", width: 20 },
    { header: "Tipo (income/expense)", key: "type", width: 18 },
    { header: "Valor", key: "amount", width: 12 },
    { header: "Conta", key: "account", width: 18 },
    { header: "Observações", key: "notes", width: 25 },
  ];

  ws.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
  ws.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF0EA5E9" },
  };
  ws.getRow(1).alignment = { vertical: "middle", horizontal: "center" };
  ws.getRow(1).height = 28;

  ws.addRow({
    date: "2026-03-22",
    description: "Salário Março",
    category: "Salário",
    type: "income",
    amount: "8500,00",
    account: "Nubank",
    notes: "Exemplo de entrada"
  });
  ws.addRow({
    date: "2026-03-15",
    description: "Aluguel",
    category: "Moradia",
    type: "expense",
    amount: "1200,00",
    account: "Itaú",
    notes: "Exemplo de saída"
  });

  ws.getColumn("date").numFmt = "yyyy-mm-dd";
  ws.getColumn("amount").numFmt = "#,##0.00";

  ws.getCell("A3").note = "Data no formato AAAA-MM-DD";
  ws.getCell("E3").note = "Use vírgula para decimais";
  ws.getCell("D3").note = "income para entrada, expense para saída";

  ws.getRow(2).font = { italic: true, color: { argb: "FF64748B" } };
  ws.getRow(3).font = { italic: true, color: { argb: "FF64748B" } };

  ws.getColumn("notes").width = 30;

  ws.addRow({});
  ws.addRow({ description: "Preencha todos os campos obrigatórios. Campos em branco serão ignorados." });

  ws.eachRow((row, rowNumber) => {
    row.alignment = { vertical: "middle", horizontal: "left", wrapText: true };
    if (rowNumber > 1) {
      row.height = 22;
    }
  });

  await wb.xlsx.writeFile(destPath);
}

// Se o script for executado diretamente via node
if (process.argv[1].endsWith('generateImportTemplateExcel.ts')) {
  const publicPath = path.join(process.cwd(), "public", "import-template.xlsx");
  console.log(`Gerando modelo em: ${publicPath}`);
  generateImportTemplateExcel(publicPath)
    .then(() => console.log("Modelo gerado com sucesso!"))
    .catch(err => console.error("Erro ao gerar modelo:", err));
}
