// Define types for database models

export interface Book {
    id: string;
    user_id: string;
    title: string;
    author?: string;
    isbn?: string;
    cover_image?: string;
    publication_date?: string;
    publisher?: string;
    description?: string;
    status?: 'read' | 'reading' | 'to-read';
    rating?: number;
    notes?: string;
    created_at?: string;
    updated_at?: string;
}

export interface Quote {
    id: string;
    user_id: string;
    book_id?: string;
    content: string;
    page?: number;
    chapter?: string;
    favourite?: boolean; 
    created_at?: string;
    updated_at?: string;
}

export interface Tag {
    id: string;
    user_id: string;
    name: string;
    color?: string;
    created_at?: string;
}