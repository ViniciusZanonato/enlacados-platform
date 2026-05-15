import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Check, X, UserPlus, ChevronDown, ChevronUp, Clock, Send } from "lucide-react";
import type { FriendRequest } from "@/features/social/api";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { ScrollArea } from "@/components/ui/scroll-area";

interface RequestListProps {
    requests: FriendRequest[];
    onRespond: (requestId: number, accept: boolean) => void;
}

const RequestList = ({ requests, onRespond }: RequestListProps) => {
    const { user } = useAuth();
    const [isExpanded, setIsExpanded] = useState(false);

    if (requests.length === 0) return null;

    // Filter requests
    const receivedRequests = requests.filter(r => r.to_user === user?.id);
    const sentRequests = requests.filter(r => r.from_user === user?.id);

    return (
        <div className="border-b bg-card">
            {/* Header / Toggle */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full flex items-center justify-between p-3 hover:bg-accent/50 transition-colors"
            >
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <UserPlus className="w-4 h-4 text-primary" />
                    <span>Solicitações</span>
                    <span className="bg-primary/10 text-primary text-xs px-1.5 py-0.5 rounded-full">
                        {requests.length}
                    </span>
                </div>
                {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-muted-foreground" />
                ) : (
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                )}
            </button>

            {/* List Content */}
            {isExpanded && (
                <ScrollArea className="max-h-[300px]">
                    <div className="p-3 space-y-4">
                        {/* Received Section */}
                        {receivedRequests.length > 0 && (
                            <div className="space-y-2">
                                <h4 className="text-xs font-semibold text-muted-foreground px-1 uppercase tracking-wider">
                                    Recebidas
                                </h4>
                                {receivedRequests.map((req) => (
                                    <div key={req.id} className="bg-background border rounded-lg p-3 space-y-3">
                                        <div className="flex items-center gap-3">
                                            <Avatar className="w-10 h-10 border">
                                                <AvatarImage src={req.from_user_profile?.avatar_url} />
                                                <AvatarFallback className="bg-primary/5 text-primary">
                                                    {req.from_user_profile?.full_name?.charAt(0)}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-semibold text-sm truncate">
                                                    {req.from_user_profile?.full_name}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    Quer ser seu amigo
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button
                                                size="sm"
                                                className="flex-1 h-8 text-xs font-medium"
                                                onClick={() => onRespond(req.id, true)}
                                            >
                                                <Check className="w-3 h-3 mr-1" />
                                                Aceitar
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="flex-1 h-8 text-xs"
                                                onClick={() => onRespond(req.id, false)}
                                            >
                                                <X className="w-3 h-3 mr-1" />
                                                Recusar
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Sent Section */}
                        {sentRequests.length > 0 && (
                            <div className="space-y-2">
                                <h4 className="text-xs font-semibold text-muted-foreground px-1 uppercase tracking-wider pt-2 border-t">
                                    Enviadas
                                </h4>
                                {sentRequests.map((req) => (
                                    <div key={req.id} className="bg-muted/30 border rounded-lg p-3">
                                        <div className="flex items-center gap-3">
                                            <Avatar className="w-8 h-8 opacity-70">
                                                <AvatarImage src={req.to_user_profile?.avatar_url} />
                                                <AvatarFallback>
                                                    {req.to_user_profile?.full_name?.charAt(0)}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-sm truncate opacity-80">
                                                    {req.to_user_profile?.full_name}
                                                </p>
                                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                                    <Clock className="w-3 h-3" />
                                                    <span>Aguardando resposta</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </ScrollArea>
            )}
        </div>
    );
};

export default RequestList;
