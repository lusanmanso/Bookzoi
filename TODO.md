REMEMBER BEFORE INSTALLING
npm install @rollup/rollup-win32-x64-msvc
npm install @tailwindcss/oxide-win32-x64-msvc
npm install lightningcss-win32-x64-msvc

structure.md -> frontend/src/utils/supabase.ts

In the Supabase JavaScript client, the .in() method doesn't immediately return a result with a data property. Instead, it returns a PostgrestFilterBuilder object, which is meant to be part of a chain of query-building methods.