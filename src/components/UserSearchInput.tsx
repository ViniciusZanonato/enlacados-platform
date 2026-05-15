import { useState, useEffect, useRef } from "react";
import { supabase } from "@/api/supabase/client";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Loader2 } from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";

interface User {
  id: string;
  full_name: string;
  email: string;
  cpf?: string;
  profile_type?: string[];
}

interface UserSearchInputProps {
  onSelectUser: (user: User) => void;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

const UserSearchInput = ({ onSelectUser, value, onChange, placeholder, disabled }: UserSearchInputProps) => {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState(value);
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  useEffect(() => {
    setSearchTerm(value);
  }, [value]);

  useEffect(() => {
    const searchUsers = async () => {
      if (!debouncedSearchTerm) {
        setSearchResults([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const { data, error } = await supabase.rpc('search_profiles', {
          search_term: debouncedSearchTerm,
        });

        if (error) throw error;
        setSearchResults(data || []);
      } catch (error) {
        console.error("Error searching users:", error);
        setSearchResults([]);
      } finally {
        setLoading(false);
      }
    };

    searchUsers();
  }, [debouncedSearchTerm]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setSearchTerm(newValue);
    onChange(newValue);
    setOpen(true);
  };

  const handleSelect = (user: User) => {
    onSelectUser(user);
    setSearchTerm(user.email); // Display selected user's email in input
    onChange(user.email);
    setOpen(false);
  };

  return (
    <Popover open={open && searchResults.length > 0 || loading} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Input
          value={searchTerm}
          onChange={handleInputChange}
          placeholder={placeholder}
          disabled={disabled}
        />
      </PopoverTrigger>
      <PopoverContent className="p-0 w-[var(--radix-popover-trigger-width)]">
        <Command>
          {loading ? (
            <div className="flex items-center justify-center p-4">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Buscando...
            </div>
          ) : (
            <CommandList>
              <CommandEmpty>Nenhum usuário encontrado.</CommandEmpty>
              <CommandGroup>
                {searchResults.map((user) => (
                  <CommandItem
                    key={user.id}
                    value={user.email}
                    onSelect={() => handleSelect(user)}
                  >
                    {user.full_name} ({user.cpf ? `CPF: ${user.cpf}` : user.email})
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          )}
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default UserSearchInput;
