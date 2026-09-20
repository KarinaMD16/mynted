import type { ReactNode } from "react";
import type { CommunityListItem, ForumPost } from "../models/communityDTOs";

export interface CreateCommunityFormProps {
    isOpen: boolean;
    onClose: () => void;
  }

export interface SelectedImage {
    /** Imagen ya recortada: es la que se sube. */
    file: File;
    previewUrl: string;
    /** Archivo original, para poder volver a ajustar el recorte. */
    original: File;
}


export interface PrivacyOptionProps {
    icon: ReactNode;
    title: string;
    description: string;
    selected: boolean;
    onSelect: () => void;
}

export interface TagPickerProps {
    categoryId: number;
    selected: number[];
    onChange: (tagIds: number[]) => void;
    error?: string;
}

export interface ForumPostCardProps {
  post: ForumPost
  index: number
}

export interface MyCommunityCardProps {
  community: CommunityListItem
  featured?: boolean
  variant: 'blue' | 'yellow'
}
