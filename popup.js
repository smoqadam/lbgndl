function performSearch(queryText) {
    const searchType = document.getElementById('searchType').value;
    const resultsBody = document.getElementById('resultsBody');
    
    resultsBody.innerHTML = '<tr><td colspan="2">Searching...</td></tr>';
    
    try {
        const libgen = new LibGenAPI(
            searchType,
            queryText,
            25
        );
        
        libgen.search().then(books => {
            if (books.length === 0) {
                resultsBody.innerHTML = '<tr><td colspan="2">No results found</td></tr>';
                return;
            }

            resultsBody.innerHTML = books.map(book => `
                <tr>
                    <td>
                        <div class="book-info">
                            <div class="book-details">
                                <h3>${book.title}</h3>
                                <div class="book-metadata">
                                    <div>Author: ${book.author}</div>
                                    <div>Publisher: ${book.publisher} (${book.year})</div>
                                    <div>Format: ${book.extension.toUpperCase()} - ${book.size}</div>
                                    <div>Language: ${book.language}</div>
                                    <div>Pages: ${book.pages}</div>
                                </div>
                            </div>
                        </div>
                    </td>
                    <td>
                        <div class="download-links">
                            <a href="${book.downloadLink}" 
                               class="download-link" 
                               target="_blank">
                               Download
                            </a>
                            ${book.alternativeDownloadLink ? 
                                `<a href="${book.alternativeDownloadLink}" 
                                    class="download-link" 
                                    target="_blank">
                                    Mirror
                                </a>` : ''
                            }
                        </div>
                    </td>
                </tr>
            `).join('');
        }).catch(error => {
            console.error('Error:', error);
            resultsBody.innerHTML = '<tr><td colspan="2">Error fetching results</td></tr>';
        });
    } catch (error) {
        console.error('Error:', error);
        resultsBody.innerHTML = '<tr><td colspan="2">Error fetching results</td></tr>';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    
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