import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Search, MessageSquare } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import type { Friendship } from "@/features/social/api";

interface FriendListProps {
    friends: Friendship[];
    onSelectFriend: (friend: Friendship) => void;
}

const FriendList = ({ friends, onSelectFriend }: FriendListProps) => {
    const [filter, setFilter] = useState("");

    const filteredFriends = friends.filter(friend =>
        friend.friend_profile?.full_name.toLowerCase().includes(filter.toLowerCase())
    );

    return (
        <div className="flex flex-col h-full">
            <div className="p-3 border-b">
                <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar amigos..."
                        className="pl-8 h-9 text-sm"
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                    />
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {filteredFriends.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8 text-sm">
                        {filter ? "Nenhum amigo encontrado" : "Você ainda não tem amigos adicionados"}
                    </div>
                ) : (
                    filteredFriends.map((friend) => (
                        <button
                            key={friend.id}
                            onClick={() => onSelectFriend(friend)}
                            className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-accent transition-colors text-left group"
                        >
                            <div className="relative">
                                <Avatar className="w-10 h-10 border-2 border-background">
                                    <AvatarImage src={undefined} /> {/* Assuming backend isn't sending avatar_url inside friend_profile yet, or we need to fix generic */}
                                    <AvatarFallback className="bg-primary/10 text-primary">
                                        {friend.friend_profile?.full_name.charAt(0)}
                                    </AvatarFallback>
                                </Avatar>
                                <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-background rounded-full"></span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm truncate">
                                    {friend.friend_profile?.full_name}
                                </p>
                                <p className="text-xs text-muted-foreground truncate">
                                    Online agora
                                </p>
                            </div>
                            <MessageSquare className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                    ))
                )}
            </div>
        </div>
    );
};

export default FriendList;
