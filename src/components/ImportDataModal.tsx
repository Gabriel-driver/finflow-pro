import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";

const TEMPLATE_URL = "/import-template.xlsx";

export function ImportDataModal({ open, onClose, onSuccess }: { open: boolean; onClose: () => void; onSuccess?: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<{ success: number; failed: number; errors: string[] } | null>(null);

  const handleDownloadTemplate = () => {
    const link = document.createElement("a");
    link.href = TEMPLATE_URL;
    link.download = "modelo-importacao-finflow.xlsx";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFile(e.target.files?.[0] || null);
    setError(null);
    setResult(null);
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setProgress(10);
    setError(null);
    setResult(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      setProgress(30);
      const res = await fetch("/api/import", {
        method: "POST",
        body: formData,
      });
      setProgress(70);
      const data = await res.json();
      if (res.ok) {
        setResult(data);
        setProgress(100);
        toast.success("Importação concluída!", { description: `${data.success} registros importados, ${data.failed} com erro.` });
        onSuccess?.();
      } else {
        setError(data.error || "Erro ao importar dados");
        setProgress(0);
      }
    } catch (err: any) {
      setError(err.message || "Erro desconhecido");
      setProgress(0);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Importar Dados</DialogTitle>
          <DialogDescription>
            Baixe o modelo de planilha, preencha e envie para importar seus dados.<br />
            <Button variant="link" onClick={handleDownloadTemplate} className="px-0 text-primary underline">Baixar modelo de planilha</Button>
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <input type="file" accept=".xlsx,.csv" onChange={handleFileChange} disabled={uploading} />
          {progress > 0 && <Progress value={progress} className="h-2" />}
          {error && <div className="text-destructive text-sm">{error}</div>}
          {result && (
            <div className="text-sm">
              <span className="text-success font-bold">{result.success} registros importados</span><br />
              {result.failed > 0 && <span className="text-destructive font-bold">{result.failed} erros</span>}
              {result.errors?.length > 0 && (
                <ul className="mt-1 list-disc pl-5 text-xs text-destructive">
                  {result.errors.map((err, i) => <li key={i}>{err}</li>)}
                </ul>
              )}
            </div>
          )}
        </div>
        <DialogFooter>
          <Button onClick={handleUpload} disabled={!file || uploading}>
            {uploading ? 'Importando...' : 'Importar'}
          </Button>
          <Button variant="ghost" onClick={onClose} disabled={uploading}>Cancelar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
