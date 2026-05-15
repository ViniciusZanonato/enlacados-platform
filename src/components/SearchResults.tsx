import { Building2, Briefcase, UserPlus, Users, Check, Clock } from "lucide-react";
import { Link } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useSocial } from "@/hooks/useSocial";
import { useAuth } from "@/features/auth/hooks/useAuth";

interface SearchResult {
  id: string;
  avatar_url: string;
  type: string;
  name: string;
  specialty: string | undefined;
}

const SearchResults = ({ results }: { results: SearchResult[] }) => {
  const { sendRequest, friends, allRequests } = useSocial();
  const { user } = useAuth();

  if (results.length === 0) {
    return <p className="text-muted-foreground">Nenhum resultado encontrado.</p>;
  }

  const getRelationshipStatus = (targetId: string) => {
    if (!user) return 'none';
    if (targetId === user.id) return 'self';

    // Check if already friends
    const isFriend = friends.some(f =>
      (f.user1 === user.id && f.user2 === targetId) ||
      (f.user1 === targetId && f.user2 === user.id)
    );
    if (isFriend) return 'friend';

    // Check if request sent by me
    const sent = allRequests.find(r =>
      r.from_user === user.id && r.to_user === targetId && r.status === 'PENDING'
    );
    if (sent) return 'sent';

    // Check if request received from them
    const received = allRequests.find(r =>
      r.to_user === user.id && r.from_user === targetId && r.status === 'PENDING'
    );
    if (received) return 'received';

    return 'none';
  };

  const handleAddFriend = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    await sendRequest(id);
  };

  return (
    <div className="space-y-6">
      {results.map((result) => {
        const status = getRelationshipStatus(result.id);

        return (
          <Link key={result.id} to={`/perfil/${result.id}`}>
            <div className="bg-card rounded-2xl p-6 border border-border hover:shadow-glow transition-smooth group relative">
              <div className="absolute top-6 right-6 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                {status === 'none' && (
                  <Button
                    size="sm"
                    variant="secondary"
                    className="shadow-sm"
                    onClick={(e) => handleAddFriend(e, result.id)}
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    Adicionar
                  </Button>
                )}
                {status === 'friend' && (
                  <Button size="sm" variant="ghost" disabled className="opacity-70">
                    <Users className="w-4 h-4 mr-2" />
                    Amigos
                  </Button>
                )}
                {status === 'sent' && (
                  <Button size="sm" variant="ghost" disabled className="opacity-70">
                    <Clock className="w-4 h-4 mr-2" />
                    Pendente
                  </Button>
                )}
                {status === 'received' && (
                  <Button size="sm" variant="secondary" asChild onClick={(e) => e.stopPropagation()}>
                    <Link to="/portal/social">
                      <Check className="w-4 h-4 mr-2" />
                      Responder
                    </Link>
                  </Button>
                )}
              </div>
              <div className="flex items-start gap-6">
                <Avatar className="w-16 h-16">
                  <AvatarImage src={result.avatar_url} />
                  <AvatarFallback className="gradient-hero text-white">
                    {result.type === "institution" ? (
                      <Building2 className="w-8 h-8" />
                    ) : (
                      <Briefcase className="w-8 h-8" />
                    )}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="text-xl font-bold mb-1 text-foreground">
                    {result.name}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    {result.specialty || (result.type === 'institution' ? 'Instituição' : 'Profissional')}
                  </p>
                </div>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
};

export default SearchResults;