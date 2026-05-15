import { useState, useRef } from 'react';
import { supabase } from '@/api/supabase/client';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { handleSupabaseError } from "@/lib/supabase-error-handler";

interface ImageUploadProps {
  bucket: string;
  onUpload: (url: string) => void;
  children: React.ReactNode;
  dimensions?: string; // New prop for recommended dimensions
}

const ImageUpload = ({ bucket, onUpload, children, dimensions }: ImageUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0) {
      return; // User canceled file selection
    }

    setUploading(true);
    try {
      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
      onUpload(data.publicUrl);
      toast.success('Imagem enviada com sucesso!');
    } catch (error: Error) {
      handleSupabaseError(error, "Erro ao fazer upload da imagem.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <div onClick={() => fileInputRef.current?.click()}>
        {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : children}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          disabled={uploading}
          style={{ display: 'none' }}
        />
      </div>
      {dimensions && <p className="text-xs text-muted-foreground">{dimensions}</p>}
    </div>
  );
};

export default ImageUpload;
