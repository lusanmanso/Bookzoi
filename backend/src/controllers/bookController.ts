// File: backend/src/controllers/bookController.ts
import { Request, Response } from 'express';
import supabase from '../utils/supabase.js';
import { Book, Tag, BookWithTags } from '../types/index.js';

// Handles all book-related operations
export const bookController = {

   // Get all books from this user
   getAllBooks: async (req: Request, res: Response) => {
      try {
         const userId = req.headers['user-id'] as string;

         if (!userId) {
            return res.status(401).json({ error: 'User ID required in headers' });
         }

         // Query to Supabase
         const { data: books, error } = await supabase
            .from('books')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

         if (error) {
            console.log('Error fetching books: ', error);
            return res.status(500).json({ error: error.message });
         }

         return res.status(200).json({ books });
      } catch (error) {
         console.error('Unexpected error in getAllBooks: ', error);
         return res.status(500).json({ error: 'Internal server error' });
      }
   },

   // Get a specific book with its tags
   getBookById: async (req: Request, res: Response) => {
      try {
         const userId = req.headers['user-id'] as string;
         const bookId = req.params.id;

         if (!userId) {
            return res.status(401).json({ error: 'User ID required in headers' });
         }

         if (!bookId) {
            return res.status(400).json({ error: 'Book ID is required' });
         }

         // Get the book
         const { data: book, error: bookError } = await supabase
            .from('books')
            .select('*')
            .eq('id', bookId)
            .eq('user_id', userId)
            .single();

         if (bookError) {
            console.error('Error fetching book:', bookError);
            return res.status(bookError.code === 'PGRST116' ? 404 : 500).json({
               error: bookError.code === 'PGRST116' ? 'Book not found' : bookError.message
            });
         }

         // Get the book's tags
         const { data: bookTags, error: tagsError } = await supabase
            .from('book_tags')
            .select('tag_id')
            .eq('book_id', bookId);

         if (tagsError) {
            console.error('Error fetching book tags:', tagsError);
            return res.status(500).json({ error: tagsError.message });
         }

         // Process the tags if there are any
         let tags: Tag[] = [];
         if (bookTags && bookTags.length > 0) {
            const tagIds = bookTags.map(bt => bt.tag_id);

            // Use a proper filter format for Supabase
            let orConditions = tagIds.map(id => `id.eq.${id}`).join(',');

            const { data: tagsData, error: tagsDataError } = await supabase
               .from('tags')
               .select('*')
               .or(orConditions);

            if (tagsDataError) {
               console.error('Error fetching tags:', tagsDataError);
               return res.status(500).json({ error: tagsDataError.message });
            }

            tags = tagsData || [];
         }

         // Return book with its tags
         const bookWithTags: BookWithTags = {
            ...book,
            tags
         };

         return res.status(200).json({ book: bookWithTags });
      } catch (error) {
         console.error('Unexpected error in getBookById:', error);
         return res.status(500).json({ error: 'Internal server error' });
      }
   },

   // Create a new book
   createBook: async (req: Request, res: Response) => {
      try {
         const userId = req.headers['user-id'] as string;

         if (!userId) {
            return res.status(401).json({ error: 'User ID required in headers' });
         }

         const {
            title,
            author,
            isbn,
            cover_image,
            publication_date,
            publisher,
            description,
            status,
            rating,
            notes,
            tags
         } = req.body;

         if (!title) {
            return res.status(400).json({ error: 'Title is required' });
         }

         // Create book
         const { data: newBook, error: bookError } = await supabase
            .from('books')
            .insert([{
               userId: userId,
               title,
               author,
               isbn,
               cover_image,
               publication_date,
               publisher,
               description,
               status: status || 'to-read',
               rating,
               notes,
               created_at: new Date().toISOString(),
               updated_at: new Date().toISOString()
            }])
            .select()
            .single();

         if (bookError) {
            console.error('Error creating book: ', bookError);
            return res.status(500).json({ error: bookError.message });
         }

         // Add tags if provided
         if (tags && Array.isArray(tags) && tags.length > 0) {
            const bookTags = tags.map((tagsId: string) => ({
               book_id: newBook.id,
               tag_id: tagsId,
               created_at: new Date().toISOString()
            }));

            const { error: tagError } = await supabase
               .from('book_tags')
               .insert(bookTags);

            if (tagError) {
               console.error('Error adding tags to book: ', tagError);
               // Still return the book if tag assignment fails
            }
         }

         return res.status(201).json({ book: newBook });

      } catch (error) {
         console.log('Unexpected error in createBook: ', error);
         return res.status(500).json({ error: 'Internal server error' });
      }
   },

   

}
