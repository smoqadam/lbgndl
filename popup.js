function createBookElement(book) {
    const tr = document.createElement('tr');
    
    const tdInfo = document.createElement('td');
    const bookInfo = document.createElement('div');
    bookInfo.className = 'book-info';
    
    const details = document.createElement('div');
    details.className = 'book-details';
    
    const title = document.createElement('h3');
    title.textContent = book.title;
    details.appendChild(title);
    
    const metadata = document.createElement('div');
    metadata.className = 'book-metadata';
    
    const metadataItems = [
        { label: 'Author', value: book.author },
        { label: 'Publisher', value: `${book.publisher} (${book.year})` },
        { label: 'Format', value: `${book.extension.toUpperCase()} - ${book.size}` },
        { label: 'Language', value: book.language },
        { label: 'Pages', value: book.pages }
    ];
    
    metadataItems.forEach(item => {
        const div = document.createElement('div');
        div.textContent = `${item.label}: ${item.value}`;
        metadata.appendChild(div);
    });
    
    details.appendChild(metadata);
    bookInfo.appendChild(details);
    tdInfo.appendChild(bookInfo);
    
    const tdDownload = document.createElement('td');
    const downloadLinks = document.createElement('div');
    downloadLinks.className = 'download-links';
    
    const mainLink = document.createElement('a');
    mainLink.href = book.downloadLink;
    mainLink.className = 'download-link';
    mainLink.target = '_blank';
    mainLink.textContent = 'Download';
    downloadLinks.appendChild(mainLink);
    
    if (book.alternativeDownloadLink) {
        const altLink = document.createElement('a');
        altLink.href = book.alternativeDownloadLink;
        altLink.className = 'download-link';
        altLink.target = '_blank';
        altLink.textContent = 'Mirror';
        downloadLinks.appendChild(altLink);
    }
    
    tdDownload.appendChild(downloadLinks);
    tr.appendChild(tdInfo);
    tr.appendChild(tdDownload);
    
    return tr;
}

function performSearch(queryText) {
    const searchType = document.getElementById('searchType').value;
    const resultsBody = document.getElementById('resultsBody');
    
    while (resultsBody.firstChild) {
        resultsBody.removeChild(resultsBody.firstChild);
    }
    
    const loadingRow = document.createElement('tr');
    const loadingCell = document.createElement('td');
    loadingCell.colSpan = 2;
    loadingCell.textContent = 'Searching...';
    loadingRow.appendChild(loadingCell);
    resultsBody.appendChild(loadingRow);
    
    try {
        const libgen = new LibGenAPI(searchType, queryText, 25);
        
        libgen.search().then(books => {
            while (resultsBody.firstChild) {
                resultsBody.removeChild(resultsBody.firstChild);
            }
            
            if (books.length === 0) {
                const noResultsRow = document.createElement('tr');
                const noResultsCell = document.createElement('td');
                noResultsCell.colSpan = 2;
                noResultsCell.textContent = 'No results found';
                noResultsRow.appendChild(noResultsCell);
                resultsBody.appendChild(noResultsRow);
                return;
            }

            books.forEach(book => {
                resultsBody.appendChild(createBookElement(book));
            });
        }).catch(error => {
            console.error('Error:', error);
            while (resultsBody.firstChild) {
                resultsBody.removeChild(resultsBody.firstChild);
            }
            
            const errorRow = document.createElement('tr');
            const errorCell = document.createElement('td');
            errorCell.colSpan = 2;
            errorCell.textContent = 'Error fetching results';
            errorRow.appendChild(errorCell);
            resultsBody.appendChild(errorRow);
        });
    } catch (error) {
        console.error('Error:', error);
        while (resultsBody.firstChild) {
            resultsBody.removeChild(resultsBody.firstChild);
        }
        
        const errorRow = document.createElement('tr');
        const errorCell = document.createElement('td');
        errorCell.colSpan = 2;
        errorCell.textContent = 'Error fetching results';
        errorRow.appendChild(errorCell);
        resultsBody.appendChild(errorRow);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    chrome.storage.local.get(['termsAccepted'], (result) => {
        if (!result.termsAccepted) {
            chrome.windows.create({
                url: 'terms.html',
                type: 'popup',
                width: 800,
                height: 600
            });
            window.close();
            return;
        }
        
        const searchButton = document.getElementById('searchButton');
        const queryInput = document.getElementById('query');

        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            chrome.scripting.executeScript({
                target: { tabId: tabs[0].id },
                func: () => window.getSelection().toString()
            }, (results) => {
                const selectedText = results[0]?.result;
                if (selectedText) {
                    queryInput.value = selectedText;
                    performSearch(selectedText);
                }
            });
        });

        searchButton.addEventListener('click', () => {
            const queryText = queryInput.value.trim();
            if (queryText) {
                performSearch(queryText);
            }
        });

        queryInput.addEventListener('keypress', (event) => {
            if (event.key === 'Enter') {
                const queryText = queryInput.value.trim();
                if (queryText) {
                    performSearch(queryText);
                }
            }
        });
    });
});
