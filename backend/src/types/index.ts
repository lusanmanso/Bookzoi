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

// Tag types
export interface Tag {
    id: string;
    user_id: string;
    name: string;
    color?: string;
    created_at?: string;
}

export interface BookTag {
    id: string;
    book_id: string;
    tag_id: string;
    created_at?: string;
}

export interface QuoteTag {
    id: string;
    quote_id: string;
    tag_id: string;
    created_at?: string;
}

export interface Connection {
    id: string;
    user_id: string;
    source_quote_id: string;
    target_quote_id: string;
    relationship_type?: string;
    notes?: string;
    created_at?: string;
}

// Request and response types
export interface BookWithTags extends Book {
    tags?: Tag[];
}

export interface QuoteWithTags extends Quote {
    tags?: Tag[];
    book?: Book;
}