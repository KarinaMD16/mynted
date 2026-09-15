import type { ReactNode } from "react";

export interface CreateCommunityFormProps {
    isOpen: boolean;
    onClose: () => void;
  }

export interface SelectedImage {
    file: File;
    previewUrl: string;
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