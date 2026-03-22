import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ImportDataModal } from "@/components/ImportDataModal";
import { AppLayout } from "@/components/AppLayout";

const TEMPLATE_URL = "/import-template.xlsx";

export default function ImportPage() {
  const [open, setOpen] = useState(false);
  const handleDownloadTemplate = () => {
    const link = document.createElement("a");
    link.href = TEMPLATE_URL;
    link.download = "modelo-importacao-finflow.xlsx";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  return (
    <AppLayout title="Importar Dados">
      <div className="max-w-2xl mx-auto py-10">
        <h1 className="text-2xl font-bold mb-2">Importar Dados</h1>
        <p className="mb-4 text-muted-foreground">Traga seus dados de outra planilha para o FinFlow Pro. Baixe o modelo, preencha e importe com segurança.</p>
        <div className="flex gap-2 mb-4">
          <Button variant="secondary" onClick={handleDownloadTemplate}>Baixar modelo de planilha</Button>
          <Button onClick={() => setOpen(true)}>Importar Planilha</Button>
        </div>
        <ImportDataModal open={open} onClose={() => setOpen(false)} />
        <div className="mt-8 bg-muted/40 rounded-lg p-4">
          <h2 className="font-semibold mb-2">Como funciona?</h2>
          <ol className="list-decimal pl-5 space-y-1 text-sm">
            <li>Baixe o modelo de planilha e preencha com seus dados.</li>
            <li>Envie a planilha preenchida pelo botão acima.</li>
            <li>Aguarde o processamento. Você verá o progresso e possíveis erros.</li>
            <li>Se tudo estiver certo, seus dados aparecerão automaticamente no sistema!</li>
          </ol>
        </div>
      </div>
    </AppLayout>
  );
}
