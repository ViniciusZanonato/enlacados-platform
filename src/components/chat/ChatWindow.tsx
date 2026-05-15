import { useEffect, useRef, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X, Minimize2, Send, Loader2 } from "lucide-react";
import { useChat } from "@/hooks/useChat";
import type { Friendship } from "@/features/social/api";

interface ChatWindowProps {
    friend: Friendship;
    onClose: () => void;
    onMinimize?: () => void;
}

const ChatWindow = ({ friend, onClose, onMinimize }: ChatWindowProps) => {
    const {
        messages,
        loading,
        sending,
        sendMsg,
        startDM,
        selectedRoom
    } = useChat();

    const [newMessage, setNewMessage] = useState("");
    const scrollRef = useRef<HTMLDivElement>(null);
    const [initializing, setInitializing] = useState(true);

    // Initialize chat with this friend
    useEffect(() => {
        const init = async () => {
            if (friend.friend_profile?.id) {
                await startDM(friend.friend_profile.id);
            }
            setInitializing(false);
        };
        init();
    }, [friend.id]); // Re-run if friend changes, though typically window is per-friend instance

    // Auto-scroll to bottom
    useEffect(() => {
        if (scrollRef.current) {
            const scrollContainer = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
            if (scrollContainer) {
                scrollContainer.scrollTop = scrollContainer.scrollHeight;
            }
        }
    }, [messages, initializing]);

    const handleSend = async () => {
        if (!newMessage.trim() || sending) return;
        await sendMsg(newMessage);
        setNewMessage("");
    };

    return (
        <div className="flex flex-col h-full bg-background">
            {/* Header */}
            <div className="flex items-center justify-between p-3 border-b bg-primary text-primary-foreground rounded-t-lg">
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <Avatar className="w-8 h-8 border border-white/20">
                            <AvatarImage src={undefined} />
                            <AvatarFallback className="bg-white/20 text-white">
                                {friend.friend_profile?.full_name.charAt(0)}
                            </AvatarFallback>
                        </Avatar>
                        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-primary rounded-full"></span>
                    </div>
                    <div>
                        <p className="font-semibold text-sm leading-none">
                            {friend.friend_profile?.full_name}
                        </p>
                        <p className="text-[10px] text-primary-foreground/80 mt-0.5">Online</p>
                    </div>
                </div>
                <div className="flex items-center gap-1">
                    {onMinimize && (
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-primary-foreground hover:bg-white/20" onClick={onMinimize}>
                            <Minimize2 className="w-3 h-3" />
                        </Button>
                    )}
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-primary-foreground hover:bg-white/20" onClick={onClose}>
                        <X className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-hidden bg-muted/30 relative">
                {(loading || initializing) && messages.length === 0 ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-background/50 z-10">
                        <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    </div>
                ) : null}

                <ScrollArea className="h-full px-3 py-4" ref={scrollRef}>
                    <div className="space-y-4 pb-2">
                        {messages.map((msg, idx) => (
                            <div
                                key={msg.id || idx}
                                className={`flex ${msg.is_me ? 'justify-end' : 'justify-start'}`}
                            >
                                <div
                                    className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm shadow-sm ${msg.is_me
                                            ? 'bg-primary text-primary-foreground rounded-tr-none'
                                            : 'bg-white border rounded-tl-none'
                                        }`}
                                >
                                    <p>{msg.content}</p>
                                    <p className={`text-[10px] mt-1 text-right ${msg.is_me ? 'text-primary-foreground/70' : 'text-muted-foreground'
                                        }`}>
                                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
            </div>

            {/* Input Area */}
            <div className="p-3 border-t bg-background">
                <div className="flex items-center gap-2">
                    <Input
                        placeholder="Aa"
                        className="h-9 bg-muted/50 border-0 focus-visible:ring-1 focus-visible:ring-primary/50"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                    />
                    <Button
                        size="icon"
                        className="h-9 w-9 shrink-0 shadow-sm"
                        disabled={!newMessage.trim() || sending}
                        onClick={handleSend}
                    >
                        <Send className="w-4 h-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default ChatWindow;
