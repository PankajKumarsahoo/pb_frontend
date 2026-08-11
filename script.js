// ============================================================
// PRATIBHABATEE AI - FRONTEND CHAT
// ============================================================

// FastAPI backend URL
const API_URL = "http://16.192.61.123:8000/chat";

const STORAGE_KEY = "pratibhabatee_chat_history";
 
 
// ============================================================
// DOM ELEMENTS
// ============================================================
 
const chatLauncher = document.getElementById("chatLauncher");
const widgetCloseBtn = document.getElementById("widgetCloseBtn");
 
const navHome = document.getElementById("navHome");
const navHistory = document.getElementById("navHistory");
const navMenu = document.getElementById("navMenu");
 
const homeView = document.getElementById("homeView");
const historyView = document.getElementById("historyView");
const menuView = document.getElementById("menuView");
 
const historyContainer = document.getElementById("historyContainer");
 
const chatContainer = document.getElementById("chatContainer");
const chatMessages = document.getElementById("chatMessages");
const messageInput = document.getElementById("messageInput");
const sendBtn = document.getElementById("sendBtn");
const welcome = document.getElementById("welcome");
 
const newChatBtn = document.getElementById("newChatBtn");
const menuNewChatBtn = document.getElementById("menuNewChatBtn");
 
 
// ============================================================
// STATE
// ============================================================
 
let isLoading = false;
let currentSession = createEmptySession();
 
 
// ============================================================
// INITIALIZATION
// ============================================================
 
document.addEventListener("DOMContentLoaded", () => {
 
    setupLauncher();
    setupQuickCards();
    setupInputEvents();
    setupNewChat();
    setupNav();
 
});
 
 
// ============================================================
// LAUNCHER (open / close the panel)
// ============================================================
 
function setupLauncher() {
 
    chatLauncher.addEventListener("click", () => {
        document.body.classList.add("widget-open");
        messageInput.focus();
    });
 
    widgetCloseBtn.addEventListener("click", () => {
        document.body.classList.remove("widget-open");
    });
 
}
 
 
// ============================================================
// BOTTOM NAV (Home / History / Menu)
// ============================================================
 
function setupNav() {
 
    navHome.addEventListener("click", () => showView("home"));
    navHistory.addEventListener("click", () => showView("history"));
    navMenu.addEventListener("click", () => showView("menu"));
 
}
 
 
function showView(view) {
 
    homeView.classList.toggle("active-view", view === "home");
    historyView.classList.toggle("active-view", view === "history");
    menuView.classList.toggle("active-view", view === "menu");
 
    navHome.classList.toggle("active", view === "home");
    navHistory.classList.toggle("active", view === "history");
    navMenu.classList.toggle("active", view === "menu");
 
    if (view === "history") {
        renderHistory();
    }
 
}
 
 
// ============================================================
// QUICK-ACTION CARDS (welcome screen)
// ============================================================
 
function setupQuickCards() {
 
    const cards = document.querySelectorAll(".quick-card");
 
    cards.forEach(card => {
 
        card.addEventListener("click", () => {
 
            const question = card.dataset.question;
 
            if (!question) {
                return;
            }
 
            messageInput.value = question;
            sendMessage();
 
        });
 
    });
 
}
 
 
// ============================================================
// INPUT EVENTS
// ============================================================
 
function setupInputEvents() {
 
    sendBtn.addEventListener("click", () => {
        sendMessage();
    });
 
    messageInput.addEventListener("keydown", (event) => {
 
        if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            sendMessage();
        }
 
    });
 
    messageInput.addEventListener("input", () => {
 
        messageInput.style.height = "auto";
 
        messageInput.style.height =
            Math.min(messageInput.scrollHeight, 100) + "px";
 
    });
 
}
 
 
// ============================================================
// SEND MESSAGE
// ============================================================
 
async function sendMessage() {
 
    if (isLoading) {
        return;
    }
 
 
    const question = messageInput.value.trim();
 
    if (!question) {
        return;
    }
 
 
    hideWelcome();
 
    addUserMessage(question);
 
    currentSession.messages.push({ role: "user", text: question });
    if (!currentSession.title) {
        currentSession.title = question.slice(0, 48);
    }
    saveCurrentSession();
 
 
    messageInput.value = "";
    messageInput.style.height = "auto";
 
 
    const loadingMessage = addLoadingMessage();
 
    isLoading = true;
    setInputState(false);
 
 
    try {
 
        const response = await fetch(API_URL, {
 
            method: "POST",
 
            headers: {
                "Content-Type": "application/json"
            },
 
            body: JSON.stringify({ question: question })
 
        });
 
 
        if (!response.ok) {
            throw new Error(`Server returned HTTP ${response.status}`);
        }
 
 
        const data = await response.json();
 
        removeLoadingMessage(loadingMessage);
 
 
        if (data.success === false) {
            addErrorMessage(data.error || "Something went wrong.");
            return;
        }
 
 
        const answer = data.answer;
 
        if (!answer || answer.trim() === "") {
            addErrorMessage("I couldn't generate an answer. Please try again.");
            return;
        }
 
 
        addAssistantMessage(answer, data);
 
        currentSession.messages.push({ role: "assistant", text: answer, route: data.route });
        saveCurrentSession();
 
 
    } catch (error) {
 
        console.error("Chat error:", error);
 
        removeLoadingMessage(loadingMessage);
 
        addErrorMessage(
            "Unable to connect to the AI server. Please make sure FastAPI is running."
        );
 
    } finally {
 
        isLoading = false;
        setInputState(true);
        messageInput.focus();
 
    }
 
}
 
 
// ============================================================
// ADD USER MESSAGE
// ============================================================
 
function addUserMessage(message) {
 
    const messageRow = document.createElement("div");
    messageRow.className = "message-row user-row";
 
    const messageBubble = document.createElement("div");
    messageBubble.className = "message-bubble user-message";
    messageBubble.textContent = message;
 
    messageRow.appendChild(messageBubble);
    chatMessages.appendChild(messageRow);
 
    scrollToBottom();
 
}
 
 
// ============================================================
// ADD ASSISTANT MESSAGE
// ============================================================
 
function addAssistantMessage(answer, metadata = {}) {
 
    const messageRow = document.createElement("div");
    messageRow.className = "message-row assistant-row";
 
    const messageBubble = document.createElement("div");
    messageBubble.className = "message-bubble assistant-message";
 
    messageBubble.innerHTML = formatAnswer(answer);
 
 
    if (metadata.route) {
 
        const sourceInfo = document.createElement("div");
        sourceInfo.className = "message-source";
 
        let sourceText = "AI";
 
        if (metadata.route === "rag") {
            sourceText = "Website knowledge";
        } else if (metadata.route === "web") {
            sourceText = "Live web information";
        }
 
        sourceInfo.textContent = sourceText;
        messageBubble.appendChild(sourceInfo);
 
    }
 
 
    messageRow.appendChild(messageBubble);
    chatMessages.appendChild(messageRow);
 
    scrollToBottom();
 
}
 
 
// ============================================================
// FORMAT ANSWER
// ============================================================
 
function formatAnswer(text) {
 
    if (!text) {
        return "";
    }
 
    let formatted = escapeHTML(text);
 
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
 
    formatted = formatted.replace(/^\s*[-•]\s+(.*)$/gm, "<li>$1</li>");
 
    formatted = formatted.replace(/(<li>.*<\/li>)/gs, "<ul>$1</ul>");
 
    formatted = formatted.replace(/\n/g, "<br>");
 
    return formatted;
 
}
 
 
// ============================================================
// ESCAPE HTML
// ============================================================
 
function escapeHTML(text) {
 
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
 
}
 
 
// ============================================================
// LOADING MESSAGE
// ============================================================
 
function addLoadingMessage() {
 
    const messageRow = document.createElement("div");
    messageRow.className = "message-row assistant-row loading-row";
 
    const messageBubble = document.createElement("div");
    messageBubble.className = "message-bubble assistant-message loading-message";
 
    messageBubble.innerHTML = `
        <div class="typing-indicator">
            <span></span>
            <span></span>
            <span></span>
        </div>
    `;
 
    messageRow.appendChild(messageBubble);
    chatMessages.appendChild(messageRow);
 
    scrollToBottom();
 
    return messageRow;
 
}
 
 
function removeLoadingMessage(element) {
 
    if (element && element.parentNode) {
        element.parentNode.removeChild(element);
    }
 
}
 
 
// ============================================================
// ERROR MESSAGE
// ============================================================
 
function addErrorMessage(message) {
 
    const messageRow = document.createElement("div");
    messageRow.className = "message-row assistant-row";
 
    const messageBubble = document.createElement("div");
    messageBubble.className = "error-message";
    messageBubble.textContent = message;
 
    messageRow.appendChild(messageBubble);
    chatMessages.appendChild(messageRow);
 
    scrollToBottom();
 
}
 
 
// ============================================================
// HIDE / SHOW WELCOME
// ============================================================
 
function hideWelcome() {
 
    if (welcome) {
        welcome.style.display = "none";
    }
 
}
 
 
function showWelcome() {
 
    if (welcome) {
        welcome.style.display = "block";
    }
 
}
 
 
// ============================================================
// NEW CHAT
// ============================================================
 
function setupNewChat() {
 
    newChatBtn.addEventListener("click", () => {
        startNewChat();
        showView("home");
    });
 
    menuNewChatBtn.addEventListener("click", () => {
        startNewChat();
        showView("home");
    });
 
}
 
 
function startNewChat() {
 
    if (currentSession.messages.length > 0) {
        persistSession(currentSession);
    }
 
    currentSession = createEmptySession();
 
    chatMessages.innerHTML = "";
    showWelcome();
 
    messageInput.value = "";
    messageInput.style.height = "auto";
 
    messageInput.focus();
 
}
 
 
function createEmptySession() {
 
    return {
        id: `session_${Date.now()}`,
        title: "",
        startedAt: new Date().toISOString(),
        messages: []
    };
 
}
 
 
// ============================================================
// HISTORY (localStorage)
// ============================================================
 
function loadAllSessions() {
 
    try {
 
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : [];
 
    } catch (error) {
 
        console.error("Could not read chat history:", error);
        return [];
 
    }
 
}
 
 
function saveAllSessions(sessions) {
 
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
    } catch (error) {
        console.error("Could not save chat history:", error);
    }
 
}
 
 
function persistSession(session) {
 
    const sessions = loadAllSessions();
 
    const existingIndex = sessions.findIndex(s => s.id === session.id);
 
    if (existingIndex >= 0) {
        sessions[existingIndex] = session;
    } else {
        sessions.unshift(session);
    }
 
    saveAllSessions(sessions);
 
}
 
 
function saveCurrentSession() {
 
    persistSession(currentSession);
 
}
 
 
function deleteSession(sessionId) {
 
    const sessions = loadAllSessions().filter(s => s.id !== sessionId);
    saveAllSessions(sessions);
    renderHistory();
 
}
 
 
function renderHistory() {
 
    const sessions = loadAllSessions();
 
    historyContainer.innerHTML = "";
 
    if (sessions.length === 0) {
 
        historyContainer.innerHTML = `
            <div class="history-empty">
                <span class="icon">🕘</span>
                <span>No conversations yet</span>
                <span style="font-size:11px;">Start a chat to see it here.</span>
            </div>
        `;
 
        return;
 
    }
 
    sessions.forEach(session => {
 
        const item = document.createElement("div");
        item.className = "history-item";
 
        const main = document.createElement("div");
        main.className = "history-item-main";
 
        const title = document.createElement("div");
        title.className = "history-item-title";
        title.textContent = session.title || "New conversation";
 
        const meta = document.createElement("div");
        meta.className = "history-item-meta";
        meta.textContent = `${session.messages.length} messages · ${formatDate(session.startedAt)}`;
 
        main.appendChild(title);
        main.appendChild(meta);
 
        const deleteBtn = document.createElement("button");
        deleteBtn.className = "history-item-delete";
        deleteBtn.type = "button";
        deleteBtn.setAttribute("aria-label", "Delete conversation");
        deleteBtn.textContent = "✕";
 
        deleteBtn.addEventListener("click", (event) => {
            event.stopPropagation();
            deleteSession(session.id);
        });
 
        item.appendChild(main);
        item.appendChild(deleteBtn);
 
        item.addEventListener("click", () => openSession(session));
 
        historyContainer.appendChild(item);
 
    });
 
}
 
 
function openSession(session) {
 
    if (currentSession.messages.length > 0 && currentSession.id !== session.id) {
        persistSession(currentSession);
    }
 
    currentSession = session;
 
    chatMessages.innerHTML = "";
 
    if (session.messages.length > 0) {
        hideWelcome();
    } else {
        showWelcome();
    }
 
    session.messages.forEach(msg => {
 
        if (msg.role === "user") {
            addUserMessage(msg.text);
        } else {
            addAssistantMessage(msg.text, { route: msg.route });
        }
 
    });
 
    showView("home");
    messageInput.focus();
 
}
 
 
function formatDate(isoString) {
 
    try {
 
        const date = new Date(isoString);
 
        return date.toLocaleString([], {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        });
 
    } catch (error) {
 
        return "";
 
    }
 
}
 
 
// ============================================================
// ENABLE / DISABLE INPUT
// ============================================================
 
function setInputState(enabled) {
 
    messageInput.disabled = !enabled;
    sendBtn.disabled = !enabled;
 
    if (enabled) {
        sendBtn.style.opacity = "1";
        sendBtn.style.cursor = "pointer";
    } else {
        sendBtn.style.opacity = "0.5";
        sendBtn.style.cursor = "not-allowed";
    }
 
}
 
 
// ============================================================
// SCROLL CHAT TO BOTTOM
// ============================================================
 
function scrollToBottom() {
 
    setTimeout(() => {
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }, 50);
 
}
 