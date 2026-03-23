import { useState, useRef, useEffect } from "react";
import { AppLayout } from "@/components/AppLayout";
import { useFinance, formatCurrency } from "@/lib/finance-store";
import { 
  Upload, FileText, CheckCircle2, AlertCircle, 
  ArrowRight, ShieldCheck, Wallet, CreditCard, 
  Calendar, Info, ChevronRight, X, Search,
  Filter, FileSpreadsheet, Layers
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import Papa from "papaparse";

// OFX Parser helper (since node-ofx-parser might be tricky in browser)
const parseOFX = (text: string) => {
  const transactions: any[] = [];
  const stmtTrnRegex = /<STMTTRN>([\s\S]*?)<\/STMTTRN>/g;
  let match;

  while ((match = stmtTrnRegex.exec(text)) !== null) {
    const content = match[1];
    const trnType = /<TRNTYPE>(.*)/.exec(content)?.[1]?.trim();
    const dtPosted = /<DTPOSTED>(.*)/.exec(content)?.[1]?.trim();
    const trnAmt = /<TRNAMT>(.*)/.exec(content)?.[1]?.trim();
    const memo = /<MEMO>(.*)/.exec(content)?.[1]?.trim() || /<NAME>(.*)/.exec(content)?.[1]?.trim() || "Sem descrição";
    
    if (dtPosted && trnAmt) {
      // OFX Date format: YYYYMMDD...
      const year = dtPosted.substring(0, 4);
      const month = dtPosted.substring(4, 6);
      const day = dtPosted.substring(6, 8);
      
      transactions.push({
        date: `${year}-${month}-${day}`,
        description: memo,
        amount: Math.abs(parseFloat(trnAmt)),
        type: parseFloat(trnAmt) > 0 ? "income" : "expense"
      });
    }
  }
  return transactions;
};

export default function ImportPage() {
  const { accounts, creditCards, categories, addTransaction } = useFinance();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [targetType, setTargetType] = useState<"account" | "credit_card">("account");
  const [targetId, setTargetId] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setProjectedData] = useState<any[]>([]);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Set default target
  useEffect(() => {
    if (targetType === "account" && accounts.length > 0 && !targetId) {
      setTargetId(accounts[0].id.toString());
    } else if (targetType === "credit_card" && creditCards.length > 0 && !targetId) {
      setTargetId(creditCards[0].id.toString());
    }
  }, [targetType, accounts, creditCards]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    setFile(selectedFile);
    
    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      let transactions: any[] = [];

      if (selectedFile.name.toLowerCase().endsWith(".ofx")) {
        transactions = parseOFX(text);
      } else if (selectedFile.name.toLowerCase().endsWith(".csv")) {
        const result = Papa.parse(text, { header: true, skipEmptyLines: true });
        // Simple auto-mapping for CSV (looks for common bank headers)
        transactions = result.data.map((row: any) => {
          const date = row.Data || row.Date || row.date || "";
          const desc = row.Descricao || row.Description || row.memo || row.name || "";
          const valueStr = row.Valor || row.Value || row.Amount || "0";
          const val = parseFloat(valueStr.replace(',', '.'));
          
          return {
            date: date.includes('/') ? date.split('/').reverse().join('-') : date,
            description: desc,
            amount: Math.abs(val),
            type: val > 0 ? "income" : "expense"
          };
        }).filter(t => t.date && t.description);
      }

      setProjectedData(transactions);
      if (transactions.length > 0) {
        setStep(2);
      } else {
        toast.error("Não foi possível identificar transações no arquivo.");
      }
    };
    reader.readAsText(selectedFile);
  };

  const handleStartImport = async () => {
    if (!targetId) {
      toast.error("Selecione uma conta ou cartão de destino.");
      return;
    }
    setImporting(true);
    setStep(3);
    
    let successCount = 0;
    for (let i = 0; i < parsedData.length; i++) {
      const tx = parsedData[i];
      try {
        await addTransaction({
          description: tx.description,
          amount: tx.amount,
          type: tx.type,
          date: tx.date,
          category: "Outros", // Default category
          accountId: targetType === "account" ? parseInt(targetId) : undefined,
          creditCardId: targetType === "credit_card" ? parseInt(targetId) : undefined,
        });
        successCount++;
        setProgress(Math.round(((i + 1) / parsedData.length) * 100));
      } catch (err) {
        console.error("Error importing row:", err);
      }
    }

    toast.success(`${successCount} transações importadas com sucesso!`);
    setImporting(false);
    setTimeout(() => {
      window.location.href = "/transactions";
    }, 2000);
  };

  return (
    <AppLayout title="Importar Extrato">
      <div className="max-w-4xl mx-auto space-y-8 pb-20">
        
        {/* Header Section */}
        <div className="text-center space-y-2 animate-fade-in">
          <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-2xl mb-2">
            <Layers className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-3xl font-black tracking-tight">Importação Inteligente</h1>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Sincronize seu extrato bancário (OFX ou CSV) em segundos. Sem digitação manual, sem erros.
          </p>
        </div>

        {/* Stepper */}
        <div className="flex items-center justify-center gap-4 mb-8">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                step === s ? "bg-primary text-primary-foreground scale-110 shadow-lg" : 
                step > s ? "bg-success text-success-foreground" : "bg-muted text-muted-foreground"
              }`}>
                {step > s ? <CheckCircle2 className="h-4 w-4" /> : s}
              </div>
              <span className={`text-xs font-bold uppercase tracking-tighter ${step === s ? "text-foreground" : "text-muted-foreground"}`}>
                {s === 1 ? "Upload" : s === 2 ? "Revisão" : "Concluído"}
              </span>
              {s < 3 && <ChevronRight className="h-3 w-3 text-muted-foreground/30" />}
            </div>
          ))}
        </div>

        {step === 1 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-slide-up">
            {/* Left: Upload Area */}
            <div className="space-y-6">
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="group relative border-2 border-dashed border-border/60 hover:border-primary/50 rounded-3xl p-12 flex flex-col items-center justify-center transition-all cursor-pointer bg-muted/20 hover:bg-primary/5 overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Upload className="h-8 w-8 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <p className="font-bold text-lg mb-1">Arraste seu arquivo</p>
                <p className="text-sm text-muted-foreground text-center">ou clique para selecionar do computador</p>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  accept=".ofx,.csv" 
                  className="hidden" 
                />
                <div className="mt-6 flex gap-2">
                  <span className="px-2 py-1 bg-muted rounded-md text-[10px] font-black text-muted-foreground uppercase">.OFX</span>
                  <span className="px-2 py-1 bg-muted rounded-md text-[10px] font-black text-muted-foreground uppercase">.CSV</span>
                </div>
              </div>

              <div className="bg-primary/5 border border-primary/10 rounded-2xl p-4 flex gap-3">
                <ShieldCheck className="h-5 w-5 text-primary shrink-0" />
                <p className="text-xs text-muted-foreground leading-relaxed">
                  <span className="font-bold text-primary">Privacidade total:</span> Seus dados são processados localmente no seu navegador e enviados apenas para o seu banco de dados privado.
                </p>
              </div>
            </div>

            {/* Right: Destination Config */}
            <div className="glass-card rounded-3xl p-8 space-y-6 border border-border/40">
              <h3 className="font-bold flex items-center gap-2">
                <Filter className="h-4 w-4 text-primary" /> Configurar Destino
              </h3>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Tipo de Lançamento</label>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setTargetType("account")}
                      className={`flex-1 p-3 rounded-xl border flex items-center justify-center gap-2 transition-all ${
                        targetType === "account" ? "bg-primary text-primary-foreground border-primary shadow-md" : "bg-muted/30 border-border/40 hover:border-primary/30"
                      }`}
                    >
                      <Wallet className="h-4 w-4" /> <span className="text-sm font-bold">Conta</span>
                    </button>
                    <button 
                      onClick={() => setTargetType("credit_card")}
                      className={`flex-1 p-3 rounded-xl border flex items-center justify-center gap-2 transition-all ${
                        targetType === "credit_card" ? "bg-primary text-primary-foreground border-primary shadow-md" : "bg-muted/30 border-border/40 hover:border-primary/30"
                      }`}
                    >
                      <CreditCard className="h-4 w-4" /> <span className="text-sm font-bold">Cartão</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Selecionar {targetType === "account" ? "Conta" : "Cartão"}</label>
                  <select 
                    value={targetId}
                    onChange={(e) => setTargetId(e.target.value)}
                    className="w-full p-3 bg-muted/40 border border-border/40 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 appearance-none"
                  >
                    {targetType === "account" ? (
                      accounts.map(a => <option key={a.id} value={a.id}>{a.icon} {a.name}</option>)
                    ) : (
                      creditCards.map(c => <option key={c.id} value={c.id}>💳 {c.name}</option>)
                    )}
                  </select>
                </div>
              </div>

              <div className="pt-4 border-t border-border/20">
                <h4 className="text-xs font-bold mb-3 flex items-center gap-2"><Info className="h-3.5 w-3.5" /> Bancos Suportados</h4>
                <div className="grid grid-cols-2 gap-2 opacity-60 grayscale hover:opacity-100 hover:grayscale-0 transition-all">
                  {["Nubank", "Inter", "Itaú", "Bradesco", "Santander", "C6 Bank"].map(b => (
                    <div key={b} className="text-[10px] font-bold py-1.5 px-2 bg-muted rounded-lg text-center">{b}</div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 animate-slide-up">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-xl flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" /> Revisar Lançamentos
                <span className="px-2 py-0.5 bg-primary/10 text-primary rounded-full text-[10px]">{parsedData.length} encontrados</span>
              </h3>
              <div className="flex gap-2">
                <Button variant="ghost" onClick={() => setStep(1)} className="rounded-xl">Voltar</Button>
                <Button onClick={handleStartImport} className="rounded-xl bg-primary hover:bg-primary/90 px-8">Confirmar Importação</Button>
              </div>
            </div>

            <div className="glass-card rounded-3xl overflow-hidden border border-border/40">
              <div className="max-h-[500px] overflow-y-auto custom-scrollbar">
                <table className="w-full text-left">
                  <thead className="sticky top-0 bg-background/95 backdrop-blur-md z-10">
                    <tr className="border-b border-border/40">
                      <th className="px-6 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Data</th>
                      <th className="px-6 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Descrição</th>
                      <th className="px-6 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest text-right">Valor</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/10">
                    {parsedData.map((tx, i) => (
                      <tr key={i} className="hover:bg-muted/20 transition-colors group">
                        <td className="px-6 py-4 text-sm tabular-nums font-medium text-muted-foreground">
                          {new Date(tx.date).toLocaleDateString("pt-BR")}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className={`h-2 w-2 rounded-full ${tx.type === "income" ? "bg-success" : "bg-destructive"}`} />
                            <span className="text-sm font-bold">{tx.description}</span>
                          </div>
                        </td>
                        <td className={`px-6 py-4 text-sm font-black text-right tabular-nums ${tx.type === "income" ? "text-success" : "text-destructive"}`}>
                          {tx.type === "income" ? "+" : "-"}{formatCurrency(tx.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="max-w-md mx-auto py-12 space-y-8 text-center animate-fade-in">
            <div className="relative inline-flex">
              <div className={`h-24 w-24 rounded-full flex items-center justify-center transition-all duration-500 ${progress === 100 ? "bg-success text-success-foreground scale-110" : "bg-primary/10 text-primary"}`}>
                {progress === 100 ? <CheckCircle2 className="h-12 w-12" /> : <Upload className="h-10 w-10 animate-bounce" />}
              </div>
              {progress < 100 && (
                <div className="absolute inset-0 h-24 w-24 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
              )}
            </div>
            
            <div className="space-y-2">
              <h3 className="text-2xl font-black">{progress === 100 ? "Importação Concluída!" : "Processando..."}</h3>
              <p className="text-muted-foreground text-sm">
                {progress === 100 ? "Suas finanças foram atualizadas. Redirecionando..." : `Importando ${parsedData.length} transações para sua base de dados.`}
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold uppercase tracking-tighter">
                <span>Progresso</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="h-3 rounded-full" />
            </div>
          </div>
        )}

      </div>
    </AppLayout>
  );
}
