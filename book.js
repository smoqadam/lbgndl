// the logic stolen from: https://github.com/Factual0367/libgenapi/blob/main/libgenapi.go
class Book {
    constructor() {
        this.id = '';
        this.md5 = '';
        this.title = '';
        this.author = '';
        this.publisher = '';
        this.year = '';
        this.language = '';
        this.pages = '';
        this.size = '';
        this.extension = '';
        this.downloadLink = '';
        this.alternativeDownloadLink = '';
        this.coverLink = '';
    }

    static removeISBN(str) {
        const regex = /\b\S*\d{4,}\S*\b/g;
        return str.replace(regex, '').replace(/,/g, '').trim();
    }

    static generateDownloadLink(md5, bookId, bookTitle, bookFiletype) {
        let newBookId;
        const idLength = bookId.length;
        
        if (idLength === 4) newBookId = bookId[0] + '000';
        else if (idLength === 5) newBookId = bookId.slice(0, 2) + '000';
        else if (idLength === 6) newBookId = bookId.slice(0, 3) + '000';
        else if (idLength === 7) newBookId = bookId.slice(0, 4) + '000';
        
        md5 = md5.toLowerCase();
        bookTitle = bookTitle.replace(/ /g, '_');
        return `https://download.library.lol/main/${newBookId}/${md5}/${bookTitle}.${bookFiletype}`;
    }
}

class LibGenAPI {
    constructor(queryType, query, querySize = 25) {
        this.queryType = queryType;
        this.query = query;
        this.querySize = querySize;
        this.searchURL = '';
        this.results = [];
    }

    generateSearchURL() {
        const formattedQuery = this.query.replace(/ /g, '%20');
        return `https://libgen.is/search.php?req=${formattedQuery}&column=${this.queryType}&res=${this.querySize}`;
    }

    async addBookCoverLinks(books) {
        const ids = books.map(book => book.id).join(',');
        try {
            const response = await fetch(`https://libgen.is/json.php?ids=${ids}&fields=id,openlibraryid`);
            const openLibraryIds = await response.json();
            
            return books.map(book => {
                const matchingId = openLibraryIds.find(id => id.id === book.id);
                if (matchingId && matchingId.openlibraryid) {
                    book.coverLink = `https://covers.openlibrary.org/b/olid/${matchingId.openlibraryid}-M.jpg`;
                }
                return book;
            });
        } catch (error) {
            console.error('Error fetching cover links:', error);
            return books;
        }
    }

    async search() {
        this.searchURL = this.generateSearchURL();
        
        try {
            const response = await fetch(this.searchURL);
            const html = await response.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            
            const rows = Array.from(doc.querySelectorAll('tr')).slice(1); // Skip header row
            const books = [];

            for (const row of rows) {
                const cells = row.querySelectorAll('td');
                if (cells.length === 0) continue;

                const book = new Book();
                const id = cells[0]?.textContent.trim();
                
                if (!id || isNaN(id)) continue;

                book.id = id;
                book.author = cells[1]?.textContent.trim() || '';
                
                const titleLink = cells[2]?.querySelector('a');
                book.title = Book.removeISBN(titleLink?.textContent.trim() || '');
                const md5Match = titleLink?.href.match(/md5=(.+)$/);
                book.md5 = md5Match ? md5Match[1] : '';
                
                if (!book.md5 || !book.title) continue;

                book.publisher = cells[3]?.textContent.trim() || '';
                book.year = cells[4]?.textContent.trim() || '';
                book.pages = cells[5]?.textContent.trim() || '';
                book.language = cells[6]?.textContent.trim() || '';
                book.size = cells[7]?.textContent.trim() || '';
                book.extension = cells[8]?.textContent.trim() || '';
                
                book.downloadLink = Book.generateDownloadLink(
                    book.md5,
                    book.id,
                    book.title,
                    book.extension
                );

                books.push(book);
            }

            this.results = await this.addBookCoverLinks(books);
            return this.results;
        } catch (error) {
            console.error('Error searching LibGen:', error);
            this.results = [];
            return [];
        }
    }
}