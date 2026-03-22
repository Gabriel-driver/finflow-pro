import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Users, Plus, Trash2, LogOut, Shield, UserCheck, AlertCircle, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

interface User {
  id: number;
  username: string;
  email: string;
  created_at: string;
}

interface LogEntry {
  id: number;
  timestamp: string;
  level: string;
  message: string;
  user: string;
}

export default function Admin() {
  const [users, setUsers] = useState<User[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [newUser, setNewUser] = useState({ username: '', email: '', password: '' });
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [logSearch, setLogSearch] = useState('');
  const [logLevel, setLogLevel] = useState<'ALL' | 'INFO' | 'WARNING' | 'ERROR'>('ALL');
  const [activeTab, setActiveTab] = useState<'users' | 'logs'>('users');
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const showError = (error: unknown, fallback: string) => {
    console.error(fallback, error);
    const errText = error instanceof Error ? error.message : String(error);
    setMessage({ type: 'error', text: errText || fallback });
  };

  const loadLogs = async (search = '', level = 'ALL') => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const query = new URLSearchParams();
      if (search) query.set('search', search);
      if (level && level !== 'ALL') query.set('level', level);

      const logsRes = await fetch(`/api/admin/logs?${query.toString()}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!logsRes.ok) throw new Error('Erro ao carregar logs');
      const logsData = await logsRes.json();
      setLogs(logsData);
    } catch (error: unknown) {
      showError(error, 'Erro ao carregar logs do admin');
    }
  };

  const loadData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const usersRes = await fetch('/api/admin/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (usersRes.status === 403) {
        setMessage({ type: 'error', text: 'Acesso negado - apenas admin pode acessar esta página' });
        setTimeout(() => navigate('/'), 3000);
        return;
      }

      if (!usersRes.ok) {
        throw new Error('Erro ao carregar usuários');
      }

      const usersData = await usersRes.json();
      setUsers(usersData);
      await loadLogs(logSearch, logLevel);
    } catch (error: unknown) {
      showError(error, 'Erro ao carregar dados do admin');
    } finally {
      setLoading(false);
    }
  };

  const createUser = async () => {
    if (!newUser.username || !newUser.email || !newUser.password) {
      setMessage({ type: 'error', text: 'Preencha todos os campos' });
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newUser)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao criar usuário');
      }

      const createdUser = await response.json();
      setUsers([...users, createdUser]);
      setNewUser({ username: '', email: '', password: '' });
      setShowCreateDialog(false);
      setMessage({ type: 'success', text: 'Usuário criado com sucesso!' });

      // Reload logs to show the creation
      loadData();
    } catch (error: unknown) {
      showError(error, 'Erro ao criar usuário');
    }
  };

  const deleteUser = async (userId: number) => {
    if (!confirm('Tem certeza que deseja deletar este usuário?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error('Erro ao deletar usuário');
      }

      setUsers(users.filter(u => u.id !== userId));
      setMessage({ type: 'success', text: 'Usuário deletado com sucesso!' });
      loadData(); // Reload logs
    } catch (error: unknown) {
      showError(error, 'Erro ao excluir usuário');
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-2xl font-bold">Painel Administrativo</h1>
                <p className="text-muted-foreground">Gerencie usuários e monitore o sistema</p>
              </div>
            </div>
            <Button variant="outline" onClick={logout}>
              <LogOut className="h-4 w-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* Message */}
        {message && (
          <Alert className={`mb-6 ${message.type === 'error' ? 'border-destructive' : 'border-green-500'}`}>
            {message.type === 'error' ? (
              <AlertCircle className="h-4 w-4" />
            ) : (
              <CheckCircle className="h-4 w-4" />
            )}
            <AlertDescription>{message.text}</AlertDescription>
          </Alert>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <Button
            variant={activeTab === 'users' ? 'default' : 'outline'}
            onClick={() => setActiveTab('users')}
          >
            <Users className="h-4 w-4 mr-2" />
            Usuários ({users.length})
          </Button>
          <Button
            variant={activeTab === 'logs' ? 'default' : 'outline'}
            onClick={() => setActiveTab('logs')}
          >
            <AlertCircle className="h-4 w-4 mr-2" />
            Logs do Sistema
          </Button>
        </div>

        <div className="flex items-center gap-2 mb-4">
          <Input
            placeholder="Buscar logs (mensagem ou usuário)"
            value={logSearch}
            onChange={(e) => setLogSearch(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') loadLogs(logSearch, logLevel); }}
          />
          <select value={logLevel} onChange={(e) => setLogLevel(e.target.value as 'ALL' | 'INFO' | 'WARNING' | 'ERROR')} className="h-10 px-3 border rounded-lg">
            <option value="ALL">Todos</option>
            <option value="INFO">INFO</option>
            <option value="WARNING">WARNING</option>
            <option value="ERROR">ERROR</option>
          </select>
          <Button onClick={() => loadLogs(logSearch, logLevel)}>
            <Users className="h-4 w-4 mr-2" />
            Buscar logs
          </Button>
        </div>

        {/* Users Tab */}
        {activeTab === 'users' && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Gerenciamento de Usuários</CardTitle>
                  <CardDescription>Visualize e gerencie todos os usuários do sistema</CardDescription>
                </div>
                <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Novo Usuário
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Criar Novo Usuário</DialogTitle>
                      <DialogDescription>
                        Adicione um novo usuário ao sistema
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="username">Nome de Usuário</Label>
                        <Input
                          id="username"
                          value={newUser.username}
                          onChange={(e) => setNewUser({...newUser, username: e.target.value})}
                          placeholder="Digite o nome de usuário"
                        />
                      </div>
                      <div>
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={newUser.email}
                          onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                          placeholder="Digite o email"
                        />
                      </div>
                      <div>
                        <Label htmlFor="password">Senha</Label>
                        <Input
                          id="password"
                          type="password"
                          value={newUser.password}
                          onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                          placeholder="Digite a senha"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                        Cancelar
                      </Button>
                      <Button onClick={createUser}>Criar Usuário</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Data de Criação</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>{user.id}</TableCell>
                      <TableCell className="font-medium">{user.username}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{new Date(user.created_at).toLocaleDateString('pt-BR')}</TableCell>
                      <TableCell>
                        <Badge variant={user.id === 1 ? "default" : "secondary"}>
                          {user.id === 1 ? "Admin" : "Usuário"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {user.id !== 1 && (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => deleteUser(user.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Logs Tab */}
        {activeTab === 'logs' && (
          <Card>
            <CardHeader>
              <CardTitle>Logs do Sistema</CardTitle>
              <CardDescription>Visualize as últimas atividades do sistema</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {logs.map((log) => (
                  <div key={log.id} className="flex items-start gap-3 p-3 rounded-lg border">
                    <Badge variant={log.level === 'ERROR' ? 'destructive' : 'default'}>
                      {log.level}
                    </Badge>
                    <div className="flex-1">
                      <p className="text-sm">{log.message}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(log.timestamp).toLocaleString('pt-BR')} - {log.user}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}