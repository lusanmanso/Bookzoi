// File: backend/src/controllers/bookController.ts
import { Request, Response } from 'express';
import supabase from '../utils/supabase.js';
import { Book, Tag, BookWithTags } from '../types/index.js';
import { rawListeners } from 'process';
import { create } from 'domain';

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

   // Update existing book
   updateBook: async(req: Request, res: Response) => {
      try {
         const userId = req.headers['user-id'] as string;
         const bookId = req.params.id;

         if (!userId) {
            return res.status(401).json({ error: 'User ID required in headers' });
         }

         if (!bookId) {
            return res.status(400).json({ error: 'Book ID is required' });
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
            return res.status(400).json({ error: 'Title is required '});
         }

         // First verify the book belongs to the user
         const { data: existingBook, error: checkError } = await supabase
            .from('books')
            .select('id')
            .eq('id', bookId)
            .eq('user_id', userId)
            .single();

         if (checkError || !existingBook) {
            console.error('Error finding book or book not owned by user: ', checkError);
            return res.status(checkError?.code === 'PGRST116' ? 404 : 403).json({ error: checkError?.code === 'PGRST116' ? 'Book not found': 'Not authorized to update this book' });
         }

         // Update book
         const { data: updatedBook, error: updateError } = await supabase
            .from('books')
            .update({
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
               updated_at: new Date().toISOString()
            })
            .eq('id', bookId)
            .select()
            .single();

         if (updateError) {
            console.error('Error updating book: ', updateError);
            return res.status(500).json({ error: updateError.message });
         }

         // Update tags if provided
         if (tags && Array.isArray(tags)) {
            // First remove all existing tags
            const { error: deleteTagsError } = await supabase
               .from('book_tags')
               .delete()
               .eq('book_id', bookId);

            if (deleteTagsError) {
               console.error('Error deleting existing tags: ', deleteTagsError);
               return res.status(500).json({ error: deleteTagsError.message });
               // Continue with process
            }

            // Add new tags if provided
            if (tags.length > 0) {
               const bookTags = tags.map((tagsId: string) => ({
                  bookId: bookId,
                  tag_id: tagsId,
                  created_at: new Date().toISOString()
               }));

               const { error: insertTagsError } = await supabase
                  .from('book_tags')
                  .insert(bookTags);

               if (insertTagsError) {
                  console.error('Error adding new tags: ', insertTagsError);
                  return res.status(500).json({ error: insertTagsError.message });
                  // Still rturn the updated book
               }
            }
         }

         return res.status(200).json({ book: updatedBook });
      } catch (error) {
         console.error('Unexpected error in updateBooks', error);
         return res.status(500).json({ error: 'Internal server error' });
      }
   },

   // Delete a book
   deleteBook: async (req: Request, res: Response) => {
      try {
         const userId = req.headers['user-id'] as string;
         const bookId = req.params.id;

         if (!userId) {
            return res.status(401).json({ error: 'User ID required in headers' });
         }

         if (!bookId) {
            return res.status(400).json({ error: 'Book ID is required' });
         }

         // Verify books belong to user
         const { data: existingBook, error: checkError } = await supabase
            .from('books')
            .select('id')
            .eq('id', bookId)
            .eq('user_id', userId)
            .single();

         if (!existingBook || checkError) {
            console.error('Error finding book or book not owned by user: ', checkError);
            return res.status(checkError?.code === 'PGRST116' ? 404 : 403).json({ error: checkError?.code === 'PGRST116' ? 'Book not found': 'Not authorized to delete this book' });
         }

         // Delete book
         const { error: deleteBookError } = await supabase
            .from('books')
            .delete()
            .eq('id', bookId);

         if (deleteBookError) {
            console.error('Error deleting book: ', deleteBookError);
            return res.status(500).json({ error: deleteBookError.message });
         }

         return res.status(200).json({ message: 'Book deleted successfully' });
      } catch (error) {
         console.error('Unexpected error in deleteBook: ', error);
         return res.status(500).json({ error: 'Internal server error' });
      }
   },

   // Search books
   searchBooks: async (req: Request, res: Response) => {
      try {
        const userId = req.headers['user-id'] as string;
        const { query } = req.query;

        if (!userId) {
          return res.status(401).json({ error: 'User ID required in headers' });
        }

        if (!query || typeof query !== 'string') {
          return res.status(400).json({ error: 'Search query is required' });
        }

        // Search for books matching the query
        const { data: books, error } = await supabase
          .from('books')
          .select('*')
          .eq('user_id', userId)
          .or(`title.ilike.%${query}%,author.ilike.%${query}%,description.ilike.%${query}%`);

        if (error) {
          console.error('Error searching books:', error);
          return res.status(500).json({ error: error.message });
        }

        return res.status(200).json({ books });
      } catch (error) {
        console.error('Unexpected error in searchBooks:', error);
        return res.status(500).json({ error: 'Internal server error' });
      }
    },

    // Get book by tag
    getBooksByTag: async (req: Request, res: Response) => {
      try {
        const userId = req.headers['user-id'] as string;
        const tagId = req.params.tagId;

        if (!userId) {
          return res.status(401).json({ error: 'User ID required in headers' });
        }

        if (!tagId) {
          return res.status(400).json({ error: 'Tag ID is required' });
        }

        // Get book IDs with this tag
        const { data: bookTags, error: bookTagsError } = await supabase
          .from('book_tags')
          .select('book_id')
          .eq('tag_id', tagId);

        if (bookTagsError) {
          console.error('Error fetching book tags:', bookTagsError);
          return res.status(500).json({ error: bookTagsError.message });
        }

        if (!bookTags || bookTags.length === 0) {
          return res.status(200).json({ books: [] });
        }

        const bookIds = bookTags.map(bt => bt.book_id);

        // Using OR conditions for the book IDs
        let orConditions = bookIds.map(id => `id.eq.${id}`).join(',');

        // Get books that match these IDs and belong to the user
        const { data: books, error: booksError } = await supabase
          .from('books')
          .select('*')
          .or(orConditions)
          .eq('user_id', userId);

        if (booksError) {
          console.error('Error fetching books by tag:', booksError);
          return res.status(500).json({ error: booksError.message });
        }

        return res.status(200).json({ books });
      } catch (error) {
        console.error('Unexpected error in getBooksByTag:', error);
        return res.status(500).json({ error: 'Internal server error' });
      }
    }
};

export default bookController;
