import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, User, LogOut, HelpCircle, MessageSquare, Building2, Briefcase, Settings, ArrowLeft, Loader2, PlusCircle, XCircle } from "lucide-react";
import { useState, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { supabase } from "@/api/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import Notifications from "./Notifications";

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, profile, signOut } = useAuth();
  const [menuView, setMenuView] = useState('options');

  // ── Throttle local de switch-account ──────────────────────────
  // Máximo de 5 trocas em 60 segundos (camada de UX/defense-in-depth)
  const SWITCH_THROTTLE_MAX    = 5;
  const SWITCH_THROTTLE_WINDOW = 60_000; // ms
  const switchAttemptsRef = useRef<number[]>([]); // timestamps das tentativas recentes
  const [switchThrottled, setSwitchThrottled] = useState(false);
  const switchThrottleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const checkSwitchThrottle = (): boolean => {
    const now = Date.now();
    // Remove tentativas fora da janela
    switchAttemptsRef.current = switchAttemptsRef.current.filter(
      (t) => now - t < SWITCH_THROTTLE_WINDOW
    );
    if (switchAttemptsRef.current.length >= SWITCH_THROTTLE_MAX) {
      setSwitchThrottled(true);
      // Calcula quando a janela libera (baseado na tentativa mais antiga)
      const oldest = switchAttemptsRef.current[0];
      const msUntilReset = SWITCH_THROTTLE_WINDOW - (now - oldest);
      if (switchThrottleTimerRef.current) clearTimeout(switchThrottleTimerRef.current);
      switchThrottleTimerRef.current = setTimeout(() => {
        setSwitchThrottled(false);
      }, msUntilReset + 100);
      return false; // bloqueado
    }
    switchAttemptsRef.current.push(now);
    return true; // permitido
  };

  const queryClient = useQueryClient();
  const { data: linkedAccounts, isLoading: isLoadingLinkedAccounts } = useQuery({
    queryKey: ['linkedAccounts', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase.rpc('get_linked_accounts');
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const publicLinks = [
    { path: "/", label: "Início" },
    { path: "/jornada", label: "Jornada Educacional" },
    { path: "/planos", label: "Planos" },
    { path: "/sobre", label: "Sobre Nós" },
    { path: "/contato", label: "Contato" },
    { path: "/faq", label: "FAQ" },
    // [MVP-EXCLUÍDO Sprint 4+] { path: "/marketplace", label: "Marketplace" },
    // [MVP-EXCLUÍDO Sprint 4+] { path: "/blog", label: "Blog" },
  ];

  const userLinks = [
    { path: "/", label: "Início" },
    { path: "/portal", label: "Portal" },
    { path: "/faq", label: "FAQ" },
    // [MVP-EXCLUÍDO Sprint 4+] { path: "/marketplace", label: "Marketplace" },
    // [MVP-EXCLUÍDO sem ticket ativo] { path: "/chat", label: "Chat" },
    // [MVP-EXCLUÍDO Sprint 4+] { path: "/blog", label: "Blog" },
  ];

  const navLinks = user ? userLinks : publicLinks;

  return (
    <nav className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 group">
            <img src="/logo.png" alt="Enlaçados Logo" className="w-9 h-9 transition-transform duration-300 group-hover:scale-105" />
            <span className="text-2xl font-black gradient-text" style={{ letterSpacing: '-0.03em' }}>Enlaçados</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`text-sm font-medium transition-smooth relative pb-0.5 ${
                  location.pathname === link.path
                    ? "text-primary after:absolute after:inset-x-0 after:bottom-0 after:h-px after:bg-primary after:rounded-full"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {link.label}
              </Link>
            ))}
            {
              user ? (
                <div className="flex items-center space-x-4">
                  <Notifications />
                  <DropdownMenu onOpenChange={() => setMenuView('options')}>
                    <DropdownMenuTrigger asChild>
                      <Avatar className="cursor-pointer">
                        <AvatarImage src={user.user_metadata.avatar_url || profile?.avatar_url} />
                        <AvatarFallback>
                          <User />
                        </AvatarFallback>
                      </Avatar>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-64">
                      {menuView === 'accounts' ? (
                        <>
                          <DropdownMenuLabel className="flex items-center">
                            <ArrowLeft
                              className="mr-2 h-4 w-4 cursor-pointer"
                              onClick={(e) => {
                                e.stopPropagation();
                                setMenuView('options');
                              }}
                            />
                            <span>Contas Vinculadas</span>
                          </DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="focus:bg-transparent cursor-default relative">
                            <div className="absolute top-1 right-1 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-purple-500 shadow-[0_0_4px_#A855F7,0_0_8px_#A855F7]">Atual</div>
                            <div className="flex items-center font-semibold">
                              <Avatar className="w-8 h-8 mr-3">
                                <AvatarImage src={user.user_metadata.avatar_url || profile?.avatar_url} />
                                <AvatarFallback><User /></AvatarFallback>
                              </Avatar>
                              <div className="flex flex-col">
                                <span>{profile?.full_name || user.email?.split('@')[0]}</span>
                                <span className="text-xs text-muted-foreground">{user.email}</span>
                              </div>
                            </div>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {switchThrottled && (
                            <div className="px-3 py-2 text-xs text-amber-600 bg-amber-50 dark:bg-amber-950/30 dark:text-amber-400 rounded mx-1 mb-1">
                              Aguarde antes de trocar de conta novamente.
                            </div>
                          )}
                          {isLoadingLinkedAccounts ? (
                            <DropdownMenuItem className="flex items-center justify-center py-2">
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                              <span>Carregando contas...</span>
                            </DropdownMenuItem>
                          ) : (
                            linkedAccounts?.map(account => {
                              const handleUnlink = async (e: React.MouseEvent) => {
                                e.stopPropagation();
                                if (!confirm(`Tem certeza que deseja desvincular a conta ${account.full_name || account.email}?`)) return;

                                try {
                                  toast.info('Desvinculando conta...');
                                  const { error: rpcError } = await supabase.rpc('unlink_account', {
                                    linked_user_id_to_remove: account.user_id,
                                  });

                                  if (rpcError) throw rpcError;

                                  await queryClient.invalidateQueries({ queryKey: ['linkedAccounts', user?.id] });
                                  toast.success('Conta desvinculada com sucesso!');
                                } catch (error: Error) {
                                  toast.error(error.message || 'Erro ao desvincular conta.');
                                }
                              };

                              return (
                                <DropdownMenuItem key={account.user_id} onSelect={async (e) => {
                                  e.preventDefault();

                                  // ── Throttle local (defense-in-depth) ──
                                  if (!checkSwitchThrottle()) {
                                    toast.warning('Aguarde antes de trocar de conta novamente.');
                                    return;
                                  }

                                  try {
                                    toast.info('Trocando de conta...');

                                    const { error: funcError } = await supabase.functions.invoke('switch-account', {
                                      body: { target_user_id: account.user_id },
                                    });

                                    // Trata 429 vindo da Edge Function
                                    if (funcError) {
                                      const status = (funcError as { status?: number }).status;
                                      if (status === 429) {
                                        setSwitchThrottled(true);
                                        if (switchThrottleTimerRef.current) clearTimeout(switchThrottleTimerRef.current);
                                        switchThrottleTimerRef.current = setTimeout(() => setSwitchThrottled(false), 3_600_000);
                                        toast.error('Limite de trocas de conta atingido. Aguarde antes de trocar de conta novamente.');
                                        return;
                                      }
                                      throw new Error('Não foi possível autorizar a troca de conta.');
                                    }

                                    await signOut();
                                    navigate('/auth', { state: { email: account.email } });

                                  } catch (error: Error) {
                                    toast.error(error.message || 'Ocorreu um erro ao trocar de conta.');
                                  }
                                }}>
                                  <div className="flex items-center justify-between w-full">
                                    <div className="flex items-center">
                                      <Avatar className="w-8 h-8 mr-3">
                                        <AvatarImage src={account.avatar_url || undefined} />
                                        <AvatarFallback>{account.full_name?.charAt(0) || account.email?.charAt(0)}</AvatarFallback>
                                      </Avatar>
                                      <div className="flex flex-col">
                                        <span>{account.full_name || account.email?.split('@')[0]}</span>
                                        <span className="text-xs text-muted-foreground">{account.email}</span>
                                      </div>
                                    </div>
                                    <XCircle
                                      className="h-5 w-5 text-muted-foreground/70 hover:text-destructive transition-colors cursor-pointer"
                                      onClick={handleUnlink}
                                    />
                                  </div>
                                </DropdownMenuItem>
                              )
                            })
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => navigate('/link-account')}>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            <span>Adicionar Conta</span>
                          </DropdownMenuItem>
                        </>
                      ) : (
                        <>
                          <DropdownMenuItem onClick={() => navigate("/perfil")}>
                            <User className="mr-2 h-4 w-4" />
                            <span>Minha Conta</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem onSelect={(e) => { e.preventDefault(); setMenuView('accounts'); }}>
                            <Briefcase className="mr-2 h-4 w-4" />
                            <span>Gerenciar Contas</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => navigate("/settings")}>
                            <Settings className="mr-2 h-4 w-4" />
                            <span>Configurações</span>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => navigate("/faq")}>
                            <HelpCircle className="mr-2 h-4 w-4" />
                            <span>Ajuda e Suporte</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => navigate("/feedback")}>
                            <MessageSquare className="mr-2 h-4 w-4" />
                            <span>Dar Feedback</span>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => signOut()}>
                            <LogOut className="mr-2 h-4 w-4" />
                            <span>Sair</span>
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <Link to="/auth">
                    <Button variant="outline" size="sm">Entrar</Button>
                  </Link>
                  <Link to="/auth?mode=register">
                    <Button size="sm">Começar grátis</Button>
                  </Link>
                </div>
              )
            }
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-4 pb-4 space-y-3 animate-fade-in">
            <form onSubmit={handleSearch} className="relative group px-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input
                type="search"
                placeholder="Buscar..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-10 bg-muted/50 border-none focus-visible:ring-1 focus-visible:ring-primary/50"
              />
            </form>
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`block py-2 text-sm font-medium transition-smooth ${location.pathname === link.path
                  ? "text-primary"
                  : "text-muted-foreground"
                  }`}
              >
                {link.label}
              </Link>
            ))}
            {user ? (
              <div className="flex flex-col space-y-2 pt-4 border-t">
                <Link to="/perfil" onClick={() => setMobileMenuOpen(false)} className="flex items-center space-x-2 text-muted-foreground hover:text-primary">
                  <Avatar>
                    <AvatarImage src={user.user_metadata.avatar_url || profile?.avatar_url} />
                    <AvatarFallback>
                      <User />
                    </AvatarFallback>
                  </Avatar>
                  <span>Minha Conta</span>
                </Link>
                <a onClick={() => { toast.info("Funcionalidade em desenvolvimento"); setMobileMenuOpen(false); }} className="flex items-center space-x-2 text-muted-foreground hover:text-primary cursor-pointer">
                  <div className="w-10 h-10 flex items-center justify-center">
                    <Briefcase className="h-5 w-5" />
                  </div>
                  <span>Trocar Conta</span>
                </a>
                <Link to="/settings" onClick={() => setMobileMenuOpen(false)} className="flex items-center space-x-2 text-muted-foreground hover:text-primary">
                  <div className="w-10 h-10 flex items-center justify-center">
                    <Settings className="h-4 w-4" />
                  </div>
                  <span>Configurações</span>
                </Link>
                <Link to="/faq" onClick={() => setMobileMenuOpen(false)} className="flex items-center space-x-2 text-muted-foreground hover:text-primary">
                  <HelpCircle className="h-4 w-4" />
                  <span>Ajuda e Suporte</span>
                </Link>
                <Link to="/feedback" onClick={() => setMobileMenuOpen(false)} className="flex items-center space-x-2 text-muted-foreground hover:text-primary">
                  <MessageSquare className="h-4 w-4" />
                  <span>Dar Feedback</span>
                </Link>
                <Button variant="outline" size="sm" onClick={() => signOut()} className="w-full justify-start">
                  <LogOut className="w-4 h-4 mr-2" />
                  <span>Sair</span>
                </Button>
              </div>
            ) : (
              <div className="flex flex-col gap-2 pt-2">
                <Link to="/auth" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="outline" size="sm" className="w-full">Entrar</Button>
                </Link>
                <Link to="/auth?mode=register" onClick={() => setMobileMenuOpen(false)}>
                  <Button size="sm" className="w-full">Começar grátis</Button>
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
