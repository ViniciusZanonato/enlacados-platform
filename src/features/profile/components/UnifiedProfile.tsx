import React, { useState, useEffect } from 'react';
import { supabase } from '@/api/supabase/client';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { Loader2, User, Briefcase, Building2, Edit, Save, Upload, MapPin, Phone, Globe, Plus, PlusCircle, X, Star, BookOpen, Settings, Share2, Sparkles, Calendar, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import ImageUpload from "./ImageUpload";
import EditableList from "./unified/EditableList";
import PersonalCoursesView from "./unified/PersonalCoursesView";
import InstitutionalCoursesView from "./unified/InstitutionalCoursesView";
import AwardsView from "./unified/AwardsView";
import EdictsManagement from "./EdictsManagement";
import WorkExperienceView from "./unified/WorkExperienceView";
import EducationView from "./unified/EducationView";
import PortfolioView from "./unified/PortfolioView";
import ReviewsTabContent from "./reviews/ReviewsTabContent";
import { COURSE_CATEGORIES } from "@/features/profile/constants";

import { useProfile } from "@/features/profile/hooks/useProfile";

const PROFILE_TYPE_LABELS: Record<string, string> = {
  personal: 'Aluno',
  institutional: 'Institucional',
  professional: 'Especialista',
  family: 'Familiar',
  admin: 'Admin',
};

const PLAN_LABELS: Record<string, string> = {
  free: 'Gratuito',
  essencial: 'Essencial',
  profissional: 'Profissional',
  premium: 'Premium',
  enterprise: 'Enterprise',
};

const UnifiedProfile = ({ profileId }) => {
  const { user } = useAuth();
  const {
    loading,
    isSaving, // Get isSaving state
    profile,
    personalProfile,
    professionalProfile,
    institutionalProfile,
    institutionalCourses,
    personalCourses,
    awards,
    setProfile,
    setPersonalProfile,
    setProfessionalProfile,
    setInstitutionalProfile,
    setInstitutionalCourses,
    setPersonalCourses,
    setAwards,
    loadProfileData,
    handleSave
  } = useProfile(profileId);
  const location = useLocation();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);

  const activeTab = location.hash.replace('#', '') || 'about';

  const handleTabChange = (value: string) => {
    navigate(`#${value}`);
  };

  // Check if the current user is viewing their own profile
  const isOwnProfile = user?.id === profile?.user_id;

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-primary" /></div>;
  }

  if (!profile) {
    return <div className="min-h-screen flex items-center justify-center"><p>Perfil não encontrado.</p></div>;
  }

  return (
    <div className="container mx-auto py-12 px-4 max-w-6xl">
      {/* Banner and Avatar Section */}
      <div className="relative mb-24">
        <Card className="shadow-lg rounded-3xl overflow-hidden">
            <div className="relative h-48 md:h-64 bg-muted">
                <img 
                    src={profile.banner_url || "/placeholder.svg"} 
                    alt="Banner do Perfil" 
                    className="w-full h-full object-cover"
                />
                {isOwnProfile && isEditing && (
                    <div className="absolute top-4 right-4">
                        <ImageUpload bucket="banners" onUpload={(url) => setProfile({ ...profile, banner_url: url })} dimensions="Recomendado: 1200x400px">
                            <Button size="icon" variant="outline" className="rounded-full"><Upload className="w-4 h-4" /></Button>
                        </ImageUpload>
                    </div>
                )}
            </div>
        </Card>
        <div className="absolute top-full left-1/2 -translate-x-1/2 -translate-y-1/2">
            <div className="relative w-32 h-32 md:w-40 md:h-40">
                <Avatar className="w-full h-full border-4 border-background shadow-lg">
                    <AvatarImage src={profile.avatar_url} alt={profile.full_name} />
                    <AvatarFallback className="text-4xl"><User /></AvatarFallback>
                </Avatar>
                {isOwnProfile && isEditing && (
                    <div className="absolute bottom-2 right-2">
                        <ImageUpload bucket="avatars" onUpload={(url) => setProfile({ ...profile, avatar_url: url })} dimensions="Recomendado: 200x200px">
                            <Button size="icon" variant="outline" className="rounded-full"><Upload className="w-4 h-4" /></Button>
                        </ImageUpload>
                    </div>
                )}
            </div>
        </div>
      </div>

      {/* Profile Header */}
      <div className="text-center mb-12">
        {isEditing ? (
          <Input
            type="text"
            value={profile.full_name}
            onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
            className="text-4xl font-bold text-center"
          />
        ) : (
          <h1 className="text-4xl">{profile.full_name}</h1>
        )}
        <p className="text-muted-foreground font-light mt-1">{profile.email}</p>
        <div className="flex items-center justify-center gap-2 mt-3">
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-primary/15 text-primary border border-primary/25">
            {profile.profile_type?.map(type => PROFILE_TYPE_LABELS[type] || type).join(' & ')}
          </span>
        </div>
        {isOwnProfile && (
            <Button variant="ghost" size="icon" className="ml-2" disabled={isSaving} onClick={async () => {
                if (isEditing) {
                    const success = await handleSave();
                    if (success) {
                        setIsEditing(false);
                    }
                } else {
                    setIsEditing(true);
                }
            }}>
                {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : (isEditing ? <Save className="w-5 h-5" /> : <Edit className="w-5 h-5" />)}
            </Button>
        )}
        <Button variant="ghost" size="icon" className="ml-2" onClick={() => {
            const profileUrl = `${window.location.origin}/perfil/${profile.id}`;
            navigator.clipboard.writeText(profileUrl);
            toast.success("Link do perfil copiado para a área de transferência!");
        }}>
            <Share2 className="w-5 h-5" />
        </Button>
      </div>

      {/* Main Content Grid - Centered for identity focus */}
      <div className="max-w-4xl mx-auto">
        {/* Right Content with Tabs holds the actual identity data */}
        <div className="w-full">
            <Tabs defaultValue={activeTab} onValueChange={handleTabChange} className="w-full">
                <TabsList className="grid w-full grid-cols-1 md:grid-cols-5 mb-8">
                    <TabsTrigger value="about">Sobre</TabsTrigger>
                    {profile.profile_type?.includes('institutional') && <TabsTrigger value="courses">Cursos</TabsTrigger>}
                    {profile.profile_type?.includes('professional') && <TabsTrigger value="experience">Experiência</TabsTrigger>}
                    {profile.profile_type?.includes('professional') && <TabsTrigger value="education">Educação</TabsTrigger>}
                    {!profile.profile_type?.includes('institutional') && <TabsTrigger value="history">Cursos e Prêmios</TabsTrigger>}
                    {(profile.profile_type?.includes('institutional') || profile.profile_type?.includes('professional')) && <TabsTrigger value="reviews">Avaliações</TabsTrigger>}
                    {(profile.profile_type?.includes('institutional')) && <TabsTrigger value="edicts">Editais</TabsTrigger>}
                </TabsList>

                <TabsContent value="about">
                    <Card className="shadow-lg rounded-3xl">
                        <CardHeader><CardTitle>Sobre o Perfil</CardTitle></CardHeader>
                        <CardContent className="space-y-6">
                            {/* Professional Title */}
                            <div className="text-center mb-6">
                                {isEditing ? (
                                    <Input 
                                        value={professionalProfile?.title || ''}
                                        onChange={(e) => setProfessionalProfile({ ...professionalProfile, title: e.target.value })}
                                        placeholder="Seu título profissional"
                                        className="text-xl font-semibold text-center" 
                                    />
                                ) : (
                                    <h2 className="text-xl font-semibold text-primary">{professionalProfile?.title}</h2>
                                )}
                            </div>

                            {/* Bio Section */}
                            <div className='mb-6'>
                                <h3 className="text-lg font-semibold mb-2">Informações Pessoais</h3>
                                <div className="space-y-2">
                                    <div className="flex items-center gap-4">
                                        <Label htmlFor="cpf" className="w-20">CPF</Label>
                                        {isEditing ? (
                                            <Input 
                                                id="cpf"
                                                value={profile.cpf || ''}
                                                onChange={(e) => setProfile({ ...profile, cpf: e.target.value })}
                                                placeholder="Seu CPF"
                                            />
                                        ) : (
                                            <p className="text-muted-foreground">{profile.cpf || 'Não informado'}</p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className='mb-6'>
                                <h3 className="text-lg font-semibold mb-2">Bio</h3>
                                {isEditing ? (
                                    <Textarea 
                                        value={professionalProfile?.bio || ''}
                                        onChange={(e) => setProfessionalProfile({ ...professionalProfile, bio: e.target.value })}
                                        rows={5}
                                        placeholder="Fale um pouco sobre você..."
                                    />
                                ) : (
                                    <p className="text-muted-foreground whitespace-pre-wrap">
                                        {professionalProfile?.bio || "Nenhuma bio disponível."}
                                    </p>
                                )}
                            </div>

                            {/* Details Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                                <Card className="bg-background/50 p-4">
                                    <Briefcase className="mx-auto mb-2 h-6 w-6 text-primary"/>
                                    <h4 className="font-semibold text-sm">Profissão</h4>
                                    {isEditing ? (
                                        <Input value={professionalProfile?.profession || ''} onChange={(e) => setProfessionalProfile({...professionalProfile, profession: e.target.value})} className="text-center mt-1" placeholder="Sua profissão"/>
                                    ) : (
                                        <p className="text-muted-foreground text-sm">{professionalProfile?.profession || '-'}</p>
                                    )}
                                </Card>
                                <Card className="bg-background/50 p-4">
                                    <Sparkles className="mx-auto mb-2 h-6 w-6 text-primary"/>
                                    <h4 className="font-semibold text-sm">Especialização</h4>
                                    {isEditing ? (
                                        <Input value={professionalProfile?.specialization || ''} onChange={(e) => setProfessionalProfile({...professionalProfile, specialization: e.target.value})} className="text-center mt-1" placeholder="Sua especialização"/>
                                    ) : (
                                        <p className="text-muted-foreground text-sm">{professionalProfile?.specialization || '-'}</p>
                                    )}
                                </Card>
                                <Card className="bg-background/50 p-4">
                                    <Calendar className="mx-auto mb-2 h-6 w-6 text-primary"/>
                                    <h4 className="font-semibold text-sm">Experiência</h4>
                                    {isEditing ? (
                                        <Input type="number" value={professionalProfile?.experience_years || 0} onChange={(e) => setProfessionalProfile({...professionalProfile, experience_years: e.target.valueAsNumber})} className="text-center mt-1" placeholder="Anos"/>
                                    ) : (
                                        <p className="text-muted-foreground text-sm">{professionalProfile?.experience_years ? `${professionalProfile.experience_years} anos` : '-'}</p>
                                    )}
                                </Card>
                            </div>

                            {/* Editable Lists for Skills, etc. */}
                            <div className="space-y-4 pt-6">
                                <EditableList title="Habilidades" items={professionalProfile?.skills || []} setItems={(items) => setProfessionalProfile({ ...professionalProfile, skills: items })} isEditing={isEditing} />
                                <EditableList title="Certificações" items={professionalProfile?.certifications || []} setItems={(items) => setProfessionalProfile({ ...professionalProfile, certifications: items })} isEditing={isEditing} />
                                <PortfolioView portfolio={professionalProfile?.portfolio || []} setPortfolio={(items) => setProfessionalProfile({ ...professionalProfile, portfolio: items })} isEditing={isEditing} />
                            </div>

                            {/* Mentor Section */}
                            {isOwnProfile && isEditing && profile.profile_type?.includes('professional') && (
                                <div className="space-y-4 pt-6 border-t">
                                    <h3 className="text-lg font-semibold">Programa de Mentoria</h3>
                                    <div className="flex items-center space-x-2">
                                        <Switch
                                            id="is-mentor-switch"
                                            checked={profile.is_mentor}
                                            onCheckedChange={(checked) => setProfile({ ...profile, is_mentor: checked })}
                                        />
                                        <Label htmlFor="is-mentor-switch">Disponível para mentoria</Label>
                                    </div>
                                    {profile.is_mentor && (
                                        <EditableList
                                            title="Áreas de Expertise para Mentoria"
                                            items={profile.mentor_areas_of_expertise || []}
                                            setItems={(items) => setProfile({ ...profile, mentor_areas_of_expertise: items })}
                                            isEditing={isEditing}
                                        />
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="courses">
                    <Card className="shadow-lg rounded-3xl">
                        <CardHeader><CardTitle>Cursos Oferecidos</CardTitle></CardHeader>
                        <CardContent>
                            {isOwnProfile && isEditing ? (
                                <InstitutionalCoursesView courses={institutionalCourses} setCourses={setInstitutionalCourses} isEditing={isEditing} />
                            ) : institutionalCourses && institutionalCourses.length > 0 ? (
                                <div className="space-y-8">
                                    {COURSE_CATEGORIES.map(category => {
                                        const coursesInCategory = institutionalCourses.filter(course => course.category === category);
                                        if (coursesInCategory.length === 0) return null;
                                        return (
                                            <div key={category}>
                                                <h3 className="text-xl font-bold mb-4 border-b pb-2">{category}</h3>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    {coursesInCategory.map(course => (
                                                        <div key={course.id} className="bg-muted/50 p-5 rounded-lg border">
                                                            <h4 className="font-bold">{course.name}</h4>
                                                            <p className="text-sm text-muted-foreground">{course.category}</p>
                                                            {course.landing_page_url && (
                                                                <Button asChild variant="link" className="p-0 h-auto mt-2">
                                                                    <a href={course.landing_page_url} target="_blank" rel="noopener noreferrer">Saber mais</a>
                                                                </Button>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <p>Nenhum curso encontrado para esta instituição.</p>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="history">
                    <div className="space-y-8">
                        <PersonalCoursesView courses={personalCourses} setPersonalCourses={setPersonalCourses} isEditing={isEditing} />
                        <AwardsView awards={awards} setAwards={setAwards} isEditing={isEditing} />
                    </div>
                </TabsContent>

                <TabsContent value="reviews">
                    <ReviewsTabContent profileId={profile.id} />
                </TabsContent>

                <TabsContent value="edicts">
                    <EdictsManagement institutionalProfileId={institutionalProfile?.id} />
                </TabsContent>

                <TabsContent value="experience">
                    <WorkExperienceView workExperience={professionalProfile?.work_experience || []} setWorkExperience={(work_experience) => setProfessionalProfile({ ...professionalProfile, work_experience })} isEditing={isEditing} />
                </TabsContent>

                <TabsContent value="education">
                    <EducationView education={professionalProfile?.education || []} setEducation={(education) => setProfessionalProfile({ ...professionalProfile, education })} isEditing={isEditing} />
                </TabsContent>
            </Tabs>
        </div>
      </div>
    </div>
  );
};

export default UnifiedProfile;