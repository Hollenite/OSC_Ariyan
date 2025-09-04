const promptInput = document.getElementById('prompt-input');
const generateBtn = document.getElementById('generate-btn');
const errorMessage = document.getElementById('error-message');
const loadingIndicator = document.getElementById('loading-indicator');
const imageContainer = document.getElementById('image-container');
const generatedImage = document.getElementById('generated-image');
const historyList = document.getElementById('history-list');
const clearHistoryBtn = document.getElementById('clear-history-btn');
const downloadBtn = document.getElementById('download-btn'); 
const styleSelect = document.getElementById('style-select');

const HISTORY_KEY = 'gemini-image-history';
const MAX_HISTORY_ITEMS = 20;

function getHistory() {
    const history = localStorage.getItem(HISTORY_KEY);
    return history ? JSON.parse(history) : {};
}

function saveHistory(prompt, imageUrl) {
    const history = getHistory();
    history[prompt] = imageUrl;

    const prompts = Object.keys(history);
    if (prompts.length > MAX_HISTORY_ITEMS) {
        const oldestPrompt = prompts[0];
        delete history[oldestPrompt];
    }

    try {
        localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    } catch (e) {
        if (e.name === 'QuotaExceededError') {
            errorMessage.textContent = 'Error: Storage is full. Please clear history.';
        } else {
            console.error('Failed to save history:', e);
        }
    }
}

function addPromptToHistoryUI(promptText) {
    for (let i = 0; i < historyList.children.length; i++) {
        if (historyList.children[i].textContent === promptText) {
            historyList.prepend(historyList.children[i]);
            return;
        }
    }
    const listItem = document.createElement('li');
    listItem.textContent = promptText;
    historyList.prepend(listItem);
}

function loadHistory() {
    const history = getHistory();
    historyList.innerHTML = '';
    const prompts = Object.keys(history).reverse();
    prompts.forEach(prompt => {
        const listItem = document.createElement('li');
        listItem.textContent = prompt;
        historyList.appendChild(listItem);
    });
}

generateBtn.addEventListener('click', async () => {
    const userPrompt = promptInput.value.trim();
    const styleSuffix = styleSelect.value;

    if (!userPrompt) {
        errorMessage.textContent = 'Please enter a prompt.';
        return;
    }

    const finalPrompt = userPrompt + styleSuffix;

    errorMessage.textContent = '';
    imageContainer.style.display = 'none';
    loadingIndicator.style.display = 'flex';
    generateBtn.disabled = true;

    try {
        const response = await fetch('/generate-image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: finalPrompt })
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || response.statusText);
        }
        const data = await response.json();
        
        saveHistory(userPrompt, data.imageUrl);
        addPromptToHistoryUI(userPrompt);
        
        generatedImage.src = data.imageUrl;
        downloadBtn.href = data.imageUrl;
        imageContainer.style.display = 'flex';

    } catch (err) {
        console.error('Fetch error:', err);
        errorMessage.textContent = `Error: ${err.message}`;
    } finally {
        loadingIndicator.style.display = 'none';
        generateBtn.disabled = false;
    }
});

historyList.addEventListener('click', (event) => {
    if (event.target && event.target.nodeName === 'LI') {
        const promptText = event.target.textContent;
        const history = getHistory();
        const imageUrl = history[promptText];
        if (imageUrl) {
            promptInput.value = promptText;
            generatedImage.src = imageUrl;
            downloadBtn.href = imageUrl;
            imageContainer.style.display = 'flex';
            loadingIndicator.style.display = 'none';
            errorMessage.textContent = '';
            styleSelect.value = '';
        }
    }
});

clearHistoryBtn.addEventListener('click', () => {
    if (confirm('Are you sure you want to delete all saved images? This cannot be undone.')) {
        localStorage.removeItem(HISTORY_KEY);
        historyList.innerHTML = ''; 
        imageContainer.style.display = 'none'; 
        promptInput.value = '';
        errorMessage.textContent = '';
    }
});

// --- Initial Load ---
document.addEventListener('DOMContentLoaded', loadHistory);