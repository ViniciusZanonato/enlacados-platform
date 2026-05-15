import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/api/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import DOMPurify from 'dompurify';


interface InstitutionalProfile {
  institution_name: string;
  profile_id: string;
}

interface Edict {
  id: string;
  title: string;
  content: string;
  created_at: string;
  institutional_profiles: InstitutionalProfile | null;
  category: string | null;
  status: string | null;
  target_audience: string | null;
  application_deadline: string | null;
  external_link: string | null;
}

const EdictsPage = () => {
  const [edicts, setEdicts] = useState<Edict[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedInstitution, setSelectedInstitution] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  useEffect(() => {
    const fetchEdicts = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('edicts')
          .select(`*, institutional_profiles(institution_name, profile_id)`)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setEdicts(data || []);
      } catch (error) {
        console.error('Error fetching edicts:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEdicts();
  }, []);

  const { institutions, categories, statuses } = useMemo(() => {
    const institutionSet = new Set<string>();
    const categorySet = new Set<string>();
    const statusSet = new Set<string>();
    edicts.forEach(edict => {
      if (edict.institutional_profiles?.institution_name) institutionSet.add(edict.institutional_profiles.institution_name);
      if (edict.category) categorySet.add(edict.category);
      if (edict.status) statusSet.add(edict.status);
    });
    return {
      institutions: ['all', ...Array.from(institutionSet)],
      categories: ['all', ...Array.from(categorySet)],
      statuses: ['all', ...Array.from(statusSet)],
    }
  }, [edicts]);

  const filteredEdicts = useMemo(() => {
    return edicts.filter(edict => {
      const matchesSearchTerm = searchTerm === '' ||
        edict.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        edict.content.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesInstitution = selectedInstitution === 'all' ||
        edict.institutional_profiles?.institution_name === selectedInstitution;

      const matchesCategory = selectedCategory === 'all' || edict.category === selectedCategory;
      const matchesStatus = selectedStatus === 'all' || edict.status === selectedStatus;

      return matchesSearchTerm && matchesInstitution && matchesCategory && matchesStatus;
    });
  }, [edicts, searchTerm, selectedInstitution, selectedCategory, selectedStatus]);

  return (
    <div className="container mx-auto py-12 px-4">
      <span className="label-pill text-primary/70 block mb-1">Oportunidades</span>
      <h1 className="text-5xl font-black leading-none mb-2">Editais Públicos</h1>
      <p className="text-muted-foreground font-thin mb-8">Consulte os editais publicados pelas instituições parceiras.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Input
          placeholder="Buscar por palavra-chave..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="lg:col-span-2"
        />
        <Select value={selectedInstitution} onValueChange={setSelectedInstitution}>
          <SelectTrigger>
            <SelectValue placeholder="Filtrar por instituição" />
          </SelectTrigger>
          <SelectContent>
            {institutions.map(inst => (
              <SelectItem key={inst} value={inst}>{inst === 'all' ? 'Todas as Instituições' : inst}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger>
            <SelectValue placeholder="Filtrar por categoria" />
          </SelectTrigger>
          <SelectContent>
            {categories.map(cat => (
              <SelectItem key={cat} value={cat}>{cat === 'all' ? 'Todas as Categorias' : cat}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex justify-center mt-16">
          <Loader2 className="w-12 h-12 animate-spin text-primary" />
        </div>
      ) : filteredEdicts.length === 0 ? (
        <p className="text-center text-muted-foreground mt-16">Nenhum edital encontrado.</p>
      ) : (
        <div className="space-y-6">
          {filteredEdicts.map(edict => (
            <Card key={edict.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{edict.title}</CardTitle>
                    <CardDescription>
                      Publicado por: {edict.institutional_profiles?.institution_name || 'Instituição não informada'} em {new Date(edict.created_at).toLocaleDateString('pt-BR')}
                    </CardDescription>
                  </div>
                  {edict.status && <Badge variant={edict.status === 'Aberto' ? 'default' : 'secondary'}>{edict.status}</Badge>}
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2 mb-4">
                  {edict.category && <Badge variant="outline">{edict.category}</Badge>}
                  {edict.target_audience && <Badge variant="outline">Público: {edict.target_audience}</Badge>}
                </div>
                <div
                  className="prose dark:prose-invert max-w-none mb-4"
                  dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(edict.content) }}
                />
                {edict.application_deadline &&
                  <p className="text-sm font-semibold text-destructive">Data Limite: {new Date(edict.application_deadline).toLocaleDateString('pt-BR')}</p>
                }
                {edict.external_link &&
                  <Button asChild className="mt-4">
                    <a href={edict.external_link} target="_blank" rel="noopener noreferrer">Mais Informações</a>
                  </Button>
                }
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default EdictsPage;
