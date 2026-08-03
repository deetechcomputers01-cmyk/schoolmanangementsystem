DROP INDEX "Book_isbn_key";

CREATE UNIQUE INDEX "Book_isbn_key" ON "Book"("isbn");
