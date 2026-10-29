import type { ReactNode } from "react";
import type { CommunityListItem, ForumPost } from "../models/communityDTOs";

export interface CreateCommunityOwnerOption {
    id: string;
    username: string;
}

export interface CreateCommunityFormProps {
    isOpen: boolean;
    onClose: () => void;
    /**
     * Cuentas que se pueden poner como duenas. Solo lo manda el panel de
     * administracion: el backend acepta `ownerId` unicamente de un superadmin,
     * y si no se elige ninguna la comunidad queda sin dueno. Sin esta prop el
     * campo no existe y la comunidad queda a nombre de quien la crea.
     */
    ownerOptions?: CreateCommunityOwnerOption[];
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
