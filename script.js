// Global Variables
let deferredPrompt;
let chatMessages = [];
let activeToolCategory = 'buyer';
let isVoiceRecording = false;

// DOM Elements
const mobileMenuBtn = document.getElementById('mobileMenuBtn');
const navMenu = document.getElementById('navMenu');
const installBanner = document.getElementById('installBanner');
const installBtn = document.getElementById('installBtn');
const closeBanner = document.getElementById('closeBanner');
const heroInstallBtn = document.getElementById('heroInstallBtn');
const footerInstallBtn = document.getElementById('footerInstallBtn');
const chatWidget = document.getElementById('chatWidget');
const chatToggle = document.getElementById('chatToggle');
const chatClose = document.getElementById('chatClose');
const chatMinimize = document.getElementById('chatMinimize');
const chatMessages_el = document.getElementById('chatMessages');
const chatInput = document.getElementById('chatInput');
const sendMessage = document.getElementById('sendMessage');
const voiceInput = document.getElementById('voiceInput');
const toolModal = document.getElementById('toolModal');
const modalTitle = document.getElementById('modalTitle');
const modalBody = document.getElementById('modalBody');
const modalClose = document.getElementById('modalClose');

// Initialize App
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
    setupPWA();
    setupChatbot();
    setupToolCategories();
});

// App Initialization
function initializeApp() {
    const isFirstVisit = !localStorage.getItem('magicai_visited');
    if (isFirstVisit) {
        localStorage.setItem('magicai_visited', 'true');
        showWelcomeMessage();
    }
    loadUserPreferences();
    initializeTools();
}

// Event Listeners Setup
function setupEventListeners() {
    // Mobile menu toggle
    mobileMenuBtn?.addEventListener('click', toggleMobileMenu);
    
    // Install app buttons
    [installBtn, heroInstallBtn, footerInstallBtn].forEach(btn => {
        btn?.addEventListener('click', installApp);
    });
    
    // Close install banner
    closeBanner?.addEventListener('click', hideInstallBanner);
    
    // Chat functionality
    chatToggle?.addEventListener('click', toggleChatWidget);
    chatClose?.addEventListener('click', closeChatWidget);
    chatMinimize?.addEventListener('click', minimizeChatWidget);
    sendMessage?.addEventListener('click', handleSendMessage);
    voiceInput?.addEventListener('click', toggleVoiceRecording);
    
    // Chat input
    chatInput?.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            handleSendMessage();
        }
    });
    
    // Modal close
    modalClose?.addEventListener('click', closeModal);
    
    // Click outside modal to close
    toolModal?.addEventListener('click', function(e) {
        if (e.target === toolModal) {
            closeModal();
        }
    });
    
    // Tool category tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const category = this.getAttribute('data-category');
            switchToolCategory(category);
        });
    });
    
    // Smooth scrolling for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
    
    // Scroll event for header
    window.addEventListener('scroll', handleScroll);
    
    // Resize event
    window.addEventListener('resize', handleResize);
}

// PWA Setup
function setupPWA() {
    // Listen for beforeinstallprompt event
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        showInstallBanner();
    });
    
    // Listen for app installed event
    window.addEventListener('appinstalled', (evt) => {
        console.log('Magic AI app was installed.');
        hideInstallBanner();
        showNotification('App installed successfully! 🎉', 'success');
    });
    
    // Check if app is in standalone mode
    if (window.matchMedia('(display-mode: standalone)').matches) {
        console.log('Running in standalone mode');
        document.body.classList.add('standalone');
    }
}

// Mobile Menu Toggle
function toggleMobileMenu() {
    navMenu.classList.toggle('active');
}

// Install App Function
async function installApp() {
    if (deferredPrompt) {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        
        if (outcome === 'accepted') {
            console.log('User accepted the install prompt');
            showNotification('Installing Magic AI...', 'info');
        } else {
            console.log('User dismissed the install prompt');
        }
        deferredPrompt = null;
    } else {
        // Fallback for iOS and other browsers
        showInstallInstructions();
    }
}

// Show Install Banner
function showInstallBanner() {
    if (installBanner) {
        installBanner.style.display = 'block';
    }
}

// Hide Install Banner
function hideInstallBanner() {
    if (installBanner) {
        installBanner.style.display = 'none';
    }
}

// Show Install Instructions
function showInstallInstructions() {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isAndroid = /Android/.test(navigator.userAgent);
    
    let instructions = '';
    
    if (isIOS) {
        instructions = `
            <div class="install-instructions">
                <h3>Install Magic AI on iOS</h3>
                <ol>
                    <li>Tap the Share button <i class="fas fa-share"></i></li>
                    <li>Scroll down and tap "Add to Home Screen"</li>
                    <li>Tap "Add" to install</li>
                </ol>
            </div>
        `;
    } else if (isAndroid) {
        instructions = `
            <div class="install-instructions">
                <h3>Install Magic AI on Android</h3>
                <ol>
                    <li>Tap the menu button <i class="fas fa-ellipsis-v"></i></li>
                    <li>Select "Add to Home Screen" or "Install App"</li>
                    <li>Tap "Install" to add to your device</li>
                </ol>
            </div>
        `;
    } else {
        instructions = `
            <div class="install-instructions">
                <h3>Install Magic AI</h3>
                <p>Look for the install icon <i class="fas fa-plus"></i> in your browser's address bar, or check your browser menu for "Install" or "Add to Home Screen" option.</p>
            </div>
        `;
    }
    
    openModal('Install Magic AI App', instructions);
}

// Chat Widget Functions
function toggleChatWidget() {
    if (chatWidget.style.display === 'none' || !chatWidget.style.display) {
        openChatWidget();
    } else {
        closeChatWidget();
    }
}

function openChatWidget() {
    chatWidget.style.display = 'flex';
    chatInput.focus();
    hideNotification('chatNotification');
}

function closeChatWidget() {
    chatWidget.style.display = 'none';
}

function minimizeChatWidget() {
    chatWidget.style.display = 'none';
}

// Chat Functions
function setupChatbot() {
    addBotMessage("Hello! I'm your AI real estate assistant. Ask me anything about properties, loans, investments, or use our tools!");
    addQuickActions([
        "Show me properties under 50 lakhs",
        "Calculate EMI for 30 lakhs", 
        "Best investment areas in Mumbai",
        "Compare rent vs buy",
        "Find properties near metro"
    ]);
}

function handleSendMessage() {
    const message = chatInput.value.trim();
    if (message) {
        addUserMessage(message);
        chatInput.value = '';
        processUserMessage(message);
    }
}

function addUserMessage(message) {
    const messageEl = document.createElement('div');
    messageEl.className = 'message user-message';
    messageEl.innerHTML = `
        <div class="message-content">
            <p>${message}</p>
        </div>
    `;
    chatMessages_el.appendChild(messageEl);
    scrollChatToBottom();
}

function addBotMessage(message, actions = []) {
    const messageEl = document.createElement('div');
    messageEl.className = 'message bot-message';
    
    let actionsHtml = '';
    if (actions.length > 0) {
        actionsHtml = `
            <div class="quick-actions">
                ${actions.map(action => `
                    <button class="quick-btn" onclick="handleQuickAction('${action.action}', '${action.label}')">${action.label}</button>
                `).join('')}
            </div>
        `;
    }
    
    messageEl.innerHTML = `
        <div class="message-avatar">
            <img src="https://i.postimg.cc/Px6Z8jZ9/Your-paragraph-text-1-removebg-preview.png" alt="AI">
        </div>
        <div class="message-content">
            <p>${message}</p>
            ${actionsHtml}
        </div>
    `;
    chatMessages_el.appendChild(messageEl);
    scrollChatToBottom();
}

function addQuickActions(actions) {
    const actionsEl = document.createElement('div');
    actionsEl.className = 'quick-actions';
    actionsEl.innerHTML = actions.map(action => `
        <button class="quick-btn" onclick="sendQuickMessage('${action}')">${action}</button>
    `).join('');
    
    const lastMessage = chatMessages_el.lastElementChild;
    if (lastMessage) {
        lastMessage.querySelector('.message-content').appendChild(actionsEl);
    }
}

function sendQuickMessage(message) {
    addUserMessage(message);
    processUserMessage(message);
}

function processUserMessage(message) {
    showTypingIndicator();
    setTimeout(() => {
        hideTypingIndicator();
        generateAIResponse(message);
    }, 1000 + Math.random() * 2000);
}

function generateAIResponse(message) {
    const lowerMessage = message.toLowerCase();
    let response = '';
    let actions = [];
    
    if (lowerMessage.includes('emi') || lowerMessage.includes('loan')) {
        response = "I can help you calculate EMI and check loan eligibility. What's your loan amount and tenure?";
        actions = [
            { action: 'emi-calculator', label: 'EMI Calculator' },
            { action: 'loan-eligibility', label: 'Loan Eligibility' }
        ];
    } else if (lowerMessage.includes('property') || lowerMessage.includes('house') || lowerMessage.includes('flat')) {
        response = "I can help you find properties! What's your budget and preferred location?";
        actions = [
            { action: 'property-matchmaker', label: 'Find Properties' },
            { action: 'affordability', label: 'Check Affordability' }
        ];
    } else if (lowerMessage.includes('investment') || lowerMessage.includes('roi')) {
        response = "Looking for investment opportunities? I can help analyze ROI and growth areas.";
        actions = [
            { action: 'roi-calculator', label: 'ROI Calculator' },
            { action: 'growth-heatmap', label: 'Growth Areas' }
        ];
    } else if (lowerMessage.includes('rent') || lowerMessage.includes('buy')) {
        response = "Great question! Let me help you analyze rent vs buy options for your situation.";
        actions = [
            { action: 'rent-vs-buy', label: 'Rent vs Buy Analysis' }
        ];
    } else if (lowerMessage.includes('valuation') || lowerMessage.includes('price')) {
        response = "I can help estimate property values and predict price trends. Do you want to value a specific property?";
        actions = [
            { action: 'property-valuation', label: 'Property Valuation' },
            { action: 'price-prediction', label: 'Price Prediction' }
        ];
    } else if (lowerMessage.includes('area') || lowerMessage.includes('location') || lowerMessage.includes('neighborhood')) {
        response = "I can provide detailed neighborhood insights including safety, schools, and future developments.";
        actions = [
            { action: 'neighborhood-insights', label: 'Area Insights' }
        ];
    } else {
        response = "I'm here to help with all your real estate needs! Here are some popular tools you might find useful:";
        actions = [
            { action: 'emi-calculator', label: 'EMI Calculator' },
            { action: 'property-matchmaker', label: 'Find Properties' },
            { action: 'roi-calculator', label: 'Investment Analysis' },
            { action: 'neighborhood-insights', label: 'Area Research' }
        ];
    }
    
    addBotMessage(response, actions);
}

function handleQuickAction(action, label) {
    addUserMessage(label);
    openTool(action);
}

function showTypingIndicator() {
    const typingEl = document.createElement('div');
    typingEl.className = 'message bot-message typing-indicator';
    typingEl.innerHTML = `
        <div class="message-avatar">
            <img src="https://i.postimg.cc/Px6Z8jZ9/Your-paragraph-text-1-removebg-preview.png" alt="AI">
        </div>
        <div class="message-content">
            <div class="typing-dots">
                <span></span>
                <span></span>
                <span></span>
            </div>
        </div>
    `;
    chatMessages_el.appendChild(typingEl);
    scrollChatToBottom();
}

function hideTypingIndicator() {
    const typingEl = document.querySelector('.typing-indicator');
    if (typingEl) {
        typingEl.remove();
    }
}

function scrollChatToBottom() {
    chatMessages_el.scrollTop = chatMessages_el.scrollHeight;
}

// Voice Recording
function toggleVoiceRecording() {
    if (isVoiceRecording) {
        stopVoiceRecording();
    } else {
        startVoiceRecording();
    }
}

function startVoiceRecording() {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';
        
        recognition.onstart = function() {
            isVoiceRecording = true;
            voiceInput.innerHTML = '<i class="fas fa-stop"></i>';
            voiceInput.classList.add('recording');
            showNotification('Listening... Speak now', 'info');
        };
        
        recognition.onresult = function(event) {
            const transcript = event.results[0][0].transcript;
            chatInput.value = transcript;
            handleSendMessage();
        };
        
        recognition.onend = function() {
            stopVoiceRecording();
        };
        
        recognition.onerror = function(event) {
            console.error('Speech recognition error:', event.error);
            showNotification('Voice recognition error. Please try again.', 'error');
            stopVoiceRecording();
        };
        
        recognition.start();
    } else {
        showNotification('Voice recognition not supported in this browser', 'warning');
    }
}

function stopVoiceRecording() {
    isVoiceRecording = false;
    voiceInput.innerHTML = '<i class="fas fa-microphone"></i>';
    voiceInput.classList.remove('recording');
}

// Tool Categories
function setupToolCategories() {
    switchToolCategory('buyer');
}

function switchToolCategory(category) {
    // Remove active class from all tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Add active class to clicked tab
    const activeTab = document.querySelector(`[data-category="${category}"]`);
    if (activeTab) {
        activeTab.classList.add('active');
    }
    
    // Hide all tool grids
    document.querySelectorAll('.tool-grid').forEach(grid => {
        grid.style.display = 'none';
    });
    
    // Show selected category grid
    const targetGrid = document.getElementById(`${category}-tools`);
    if (targetGrid) {
        targetGrid.style.display = 'grid';
    }
    
    activeToolCategory = category;
}

// Tool Modal Functions
function openTool(toolName) {
    const toolData = getToolData(toolName);
    if (toolData) {
        modalTitle.textContent = toolData.title;
        modalBody.innerHTML = toolData.content;
        toolModal.classList.add('active');
        toolModal.style.display = 'flex';
        initializeTool(toolName);
    }
}

function closeModal() {
    toolModal.classList.remove('active');
    toolModal.style.display = 'none';
}

function getToolData(toolName) {
    const tools = {
        'emi-calculator': {
            title: 'EMI Calculator',
            content: `
                <div class="tool-container">
                    <div class="input-section">
                        <div class="input-group">
                            <label>Loan Amount (₹)</label>
                            <input type="number" id="loanAmount" placeholder="e.g., 5000000" min="100000" max="100000000">
                        </div>
                        <div class="input-group">
                            <label>Interest Rate (% per annum)</label>
                            <input type="number" id="interestRate" placeholder="e.g., 8.5" min="1" max="20" step="0.1">
                        </div>
                        <div class="input-group">
                            <label>Loan Tenure (Years)</label>
                            <input type="number" id="loanTenure" placeholder="e.g., 20" min="1" max="30">
                        </div>
                        <button class="tool-action-btn" onclick="calculateEMI()">
                            <i class="fas fa-calculator"></i> Calculate EMI
                        </button>
                    </div>
                    <div class="result-section" id="emiResults" style="display: none;">
                        <div class="result-card">
                            <h4>Monthly EMI</h4>
                            <div class="result-value" id="monthlyEMI">₹0</div>
                        </div>
                        <div class="result-card">
                            <h4>Total Interest</h4>
                            <div class="result-value" id="totalInterest">₹0</div>
                        </div>
                        <div class="result-card">
                            <h4>Total Amount</h4>
                            <div class="result-value" id="totalAmount">₹0</div>
                        </div>
                    </div>
                </div>
            `
        },
        'loan-eligibility': {
            title: 'Loan Eligibility Checker',
            content: `
                <div class="tool-container">
                    <div class="input-section">
                        <div class="input-group">
                            <label>Monthly Income (₹)</label>
                            <input type="number" id="monthlyIncome" placeholder="e.g., 100000" min="10000">
                        </div>
                        <div class="input-group">
                            <label>Monthly Obligations (EMI, Rent etc.) (₹)</label>
                            <input type="number" id="monthlyObligations" placeholder="e.g., 15000" min="0">
                        </div>
                        <div class="input-group">
                            <label>Credit Score</label>
                            <select id="creditScore">
                                <option value="300-549">Poor (300-549)</option>
                                <option value="550-649">Fair (550-649)</option>
                                <option value="650-749">Good (650-749)</option>
                                <option value="750-900" selected>Excellent (750-900)</option>
                            </select>
                        </div>
                        <div class="input-group">
                            <label>Employment Type</label>
                            <select id="employmentType">
                                <option value="salaried" selected>Salaried</option>
                                <option value="self-employed">Self Employed</option>
                                <option value="business">Business Owner</option>
                            </select>
                        </div>
                        <button class="tool-action-btn" onclick="checkLoanEligibility()">
                            <i class="fas fa-check-circle"></i> Check Eligibility
                        </button>
                    </div>
                    <div class="result-section" id="eligibilityResults" style="display: none;">
                        <!-- Results will be populated here -->
                    </div>
                </div>
            `
        },
        'affordability': {
            title: 'Affordability Calculator',
            content: `
                <div class="tool-container">
                    <div class="input-section">
                        <div class="input-group">
                            <label>Annual Income (₹)</label>
                            <input type="number" id="annualIncome" placeholder="e.g., 1200000" min="100000">
                        </div>
                        <div class="input-group">
                            <label>Down Payment Available (₹)</label>
                            <input type="number" id="downPayment" placeholder="e.g., 1000000" min="0">
                        </div>
                        <div class="input-group">
                            <label>Monthly Expenses (₹)</label>
                            <input type="number" id="monthlyExpenses" placeholder="e.g., 40000" min="0">
                        </div>
                        <div class="input-group">
                            <label>Desired EMI to Income Ratio (%)</label>
                            <input type="number" id="emiRatio" placeholder="40" min="20" max="60" value="40">
                        </div>
                        <button class="tool-action-btn" onclick="calculateAffordability()">
                            <i class="fas fa-money-bill-wave"></i> Calculate Affordability
                        </button>
                    </div>
                    <div class="result-section" id="affordabilityResults" style="display: none;">
                        <!-- Results will be populated here -->
                    </div>
                </div>
            `
        },
        'rent-vs-buy': {
            title: 'Rent vs Buy Analyzer',
            content: `
                <div class="tool-container">
                    <div class="input-section">
                        <div class="input-group">
                            <label>Property Price (₹)</label>
                            <input type="number" id="propertyPrice" placeholder="e.g., 5000000" min="500000">
                        </div>
                        <div class="input-group">
                            <label>Monthly Rent (₹)</label>
                            <input type="number" id="monthlyRent" placeholder="e.g., 25000" min="5000">
                        </div>
                        <div class="input-group">
                            <label>Down Payment (₹)</label>
                            <input type="number" id="buyDownPayment" placeholder="e.g., 1000000" min="0">
                        </div>
                        <div class="input-group">
                            <label>Loan Interest Rate (%)</label>
                            <input type="number" id="buyInterestRate" placeholder="8.5" min="1" max="20" step="0.1">
                        </div>
                        <div class="input-group">
                            <label>Analysis Period (Years)</label>
                            <input type="number" id="analysisPeriod" placeholder="10" min="1" max="30" value="10">
                        </div>
                        <button class="tool-action-btn" onclick="analyzeRentVsBuy()">
                            <i class="fas fa-balance-scale"></i> Analyze Options
                        </button>
                    </div>
                    <div class="result-section" id="rentVsBuyResults" style="display: none;">
                        <!-- Results will be populated here -->
                    </div>
                </div>
            `
        },
        'property-matchmaker': {
            title: 'AI Property Matchmaker',
            content: `
                <div class="tool-container">
                    <div class="input-section">
                        <div class="input-group">
                            <label>Budget Range (₹)</label>
                            <div class="budget-inputs">
                                <input type="number" id="minBudget" placeholder="Min (e.g., 3000000)" min="500000">
                                <input type="number" id="maxBudget" placeholder="Max (e.g., 5000000)" min="500000">
                            </div>
                        </div>
                        <div class="input-group">
                            <label>Preferred Locations</label>
                            <input type="text" id="preferredLocations" placeholder="e.g., Bandra, Juhu, Andheri">
                        </div>
                        <div class="input-group">
                            <label>Property Type</label>
                            <select id="propertyType">
                                <option value="any">Any</option>
                                <option value="1bhk">1 BHK</option>
                                <option value="2bhk">2 BHK</option>
                                <option value="3bhk">3 BHK</option>
                                <option value="4bhk">4+ BHK</option>
                                <option value="villa">Villa/Bungalow</option>
                            </select>
                        </div>
                        <div class="input-group">
                            <label>Work Location</label>
                            <input type="text" id="workLocation" placeholder="e.g., BKC, Lower Parel">
                        </div>
                        <button class="tool-action-btn" onclick="findPropertyMatches()">
                            <i class="fas fa-heart"></i> Find Perfect Matches
                        </button>
                    </div>
                    <div class="result-section" id="matchmakerResults" style="display: none;">
                        <!-- AI-matched properties will be shown here -->
                    </div>
                </div>
            `
        },
        'roi-calculator': {
            title: 'ROI / Yield Calculator',
            content: `
                <div class="tool-container">
                    <div class="input-section">
                        <div class="input-group">
                            <label>Property Purchase Price (₹)</label>
                            <input type="number" id="purchasePrice" placeholder="e.g., 5000000" min="500000">
                        </div>
                        <div class="input-group">
                            <label>Monthly Rental Income (₹)</label>
                            <input type="number" id="rentalIncome" placeholder="e.g., 25000" min="0">
                        </div>
                        <div class="input-group">
                            <label>Annual Maintenance Cost (₹)</label>
                            <input type="number" id="maintenanceCost" placeholder="e.g., 50000" min="0">
                        </div>
                        <div class="input-group">
                            <label>Expected Annual Appreciation (%)</label>
                            <input type="number" id="appreciation" placeholder="8" min="0" max="30" step="0.1">
                        </div>
                        <div class="input-group">
                            <label>Holding Period (Years)</label>
                            <input type="number" id="holdingPeriod" placeholder="10" min="1" max="50">
                        </div>
                        <button class="tool-action-btn" onclick="calculateROI()">
                            <i class="fas fa-percentage"></i> Calculate ROI
                        </button>
                    </div>
                    <div class="result-section" id="roiResults" style="display: none;">
                        <!-- ROI calculations will be shown here -->
                    </div>
                </div>
            `
        }
    };
    
    return tools[toolName] || {
        title: 'Tool Under Development',
        content: '<div class="tool-container"><p>This tool is currently under development. Please check back soon!</p></div>'
    };
}

// Tool Calculation Functions
function calculateEMI() {
    const loanAmount = parseFloat(document.getElementById('loanAmount').value);
    const interestRate = parseFloat(document.getElementById('interestRate').value);
    const loanTenure = parseFloat(document.getElementById('loanTenure').value);
    
    if (!loanAmount || !interestRate || !loanTenure) {
        showNotification('Please fill all fields', 'warning');
        return;
    }
    
    const monthlyRate = (interestRate / 100) / 12;
    const numPayments = loanTenure * 12;
    
    const emi = (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / 
                (Math.pow(1 + monthlyRate, numPayments) - 1);
    
    const totalAmount = emi * numPayments;
    const totalInterest = totalAmount - loanAmount;
    
    document.getElementById('monthlyEMI').textContent = formatCurrency(emi);
    document.getElementById('totalInterest').textContent = formatCurrency(totalInterest);
    document.getElementById('totalAmount').textContent = formatCurrency(totalAmount);
    
    document.getElementById('emiResults').style.display = 'block';
    
    addToRecentCalculations('EMI', {
        loan: loanAmount,
        rate: interestRate,
        tenure: loanTenure,
        emi: emi
    });
}

function checkLoanEligibility() {
    const monthlyIncome = parseFloat(document.getElementById('monthlyIncome').value);
    const monthlyObligations = parseFloat(document.getElementById('monthlyObligations').value) || 0;
    const creditScore = document.getElementById('creditScore').value;
    const employmentType = document.getElementById('employmentType').value;
    
    if (!monthlyIncome) {
        showNotification('Please enter monthly income', 'warning');
        return;
    }
    
    const availableIncome = monthlyIncome - monthlyObligations;
    const maxEMI = availableIncome * 0.5;
    
    let creditMultiplier = 1.0;
    if (creditScore === '750-900') creditMultiplier = 1.2;
    else if (creditScore === '650-749') creditMultiplier = 1.0;
    else if (creditScore === '550-649') creditMultiplier = 0.8;
    else creditMultiplier = 0.6;
    
    let empMultiplier = employmentType === 'salaried' ? 1.0 : 0.9;
    
    const maxLoanAmount = maxEMI * creditMultiplier * empMultiplier * 12 * 20 / 0.08;
    
    let eligibilityStatus = 'Good';
    let statusColor = '#10b981';
    
    if (maxLoanAmount < 1000000) {
        eligibilityStatus = 'Limited';
        statusColor = '#f59e0b';
    } else if (maxLoanAmount > 5000000) {
        eligibilityStatus = 'Excellent';
        statusColor = '#10b981';
    }
    
    const resultsHTML = `
        <div class="eligibility-overview">
            <div class="eligibility-status" style="background-color: ${statusColor}; color: white; padding: 1rem; border-radius: 8px; margin-bottom: 1rem;">
                <h4>Eligibility Status: ${eligibilityStatus}</h4>
            </div>
        </div>
        <div class="eligibility-details" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
            <div class="result-card">
                <h4>Maximum EMI Capacity</h4>
                <div class="result-value">${formatCurrency(maxEMI)}</div>
            </div>
            <div class="result-card">
                <h4>Estimated Loan Amount</h4>
                <div class="result-value">${formatCurrency(maxLoanAmount)}</div>
            </div>
            <div class="result-card">
                <h4>Available Monthly Income</h4>
                <div class="result-value">${formatCurrency(availableIncome)}</div>
            </div>
        </div>
        <div class="recommendations">
            <h4>💡 Recommendations</h4>
            <ul>
                <li>Consider properties up to ${formatCurrency(maxLoanAmount * 1.25)} (with 20% down payment)</li>
                <li>Maintain credit score above 750 for better rates</li>
                <li>Keep debt-to-income ratio below 40%</li>
            </ul>
        </div>
    `;
    
    document.getElementById('eligibilityResults').innerHTML = resultsHTML;
    document.getElementById('eligibilityResults').style.display = 'block';
}

function calculateAffordability() {
    const annualIncome = parseFloat(document.getElementById('annualIncome').value);
    const downPayment = parseFloat(document.getElementById('downPayment').value) || 0;
    const monthlyExpenses = parseFloat(document.getElementById('monthlyExpenses').value) || 0;
    const emiRatio = parseFloat(document.getElementById('emiRatio').value) || 40;
    
    if (!annualIncome) {
        showNotification('Please enter annual income', 'warning');
        return;
    }
    
    const monthlyIncome = annualIncome / 12;
    const availableForEMI = (monthlyIncome - monthlyExpenses) * (emiRatio / 100);
    const maxLoanAmount = availableForEMI * 12 * 20 / 0.085;
    const maxPropertyValue = maxLoanAmount + downPayment;
    
    const resultsHTML = `
        <div class="affordability-summary">
            <div class="summary-card highlight">
                <h4>You Can Afford Properties Worth</h4>
                <div class="big-value">${formatCurrency(maxPropertyValue)}</div>
            </div>
        </div>
        <div class="affordability-breakdown">
            <div class="breakdown-item">
                <span>Maximum EMI Capacity:</span>
                <strong>${formatCurrency(availableForEMI)}</strong>
            </div>
            <div class="breakdown-item">
                <span>Maximum Loan Amount:</span>
                <strong>${formatCurrency(maxLoanAmount)}</strong>
            </div>
            <div class="breakdown-item">
                <span>Down Payment Available:</span>
                <strong>${formatCurrency(downPayment)}</strong>
            </div>
            <div class="breakdown-item">
                <span>Monthly Income After Expenses:</span>
                <strong>${formatCurrency(monthlyIncome - monthlyExpenses)}</strong>
            </div>
        </div>
        <div class="recommendations">
            <h4>💡 Smart Recommendations</h4>
            <ul>
                <li>Look for properties in the range of ${formatCurrency(maxPropertyValue * 0.8)} - ${formatCurrency(maxPropertyValue)}</li>
                <li>Consider increasing down payment to reduce EMI burden</li>
                <li>Explore areas with good appreciation potential</li>
                <li>Factor in registration costs (8-10% of property value)</li>
            </ul>
        </div>
    `;
    
    document.getElementById('affordabilityResults').innerHTML = resultsHTML;
    document.getElementById('affordabilityResults').style.display = 'block';
}

function analyzeRentVsBuy() {
    const propertyPrice = parseFloat(document.getElementById('propertyPrice').value);
    const monthlyRent = parseFloat(document.getElementById('monthlyRent').value);
    const downPayment = parseFloat(document.getElementById('buyDownPayment').value) || 0;
    const interestRate = parseFloat(document.getElementById('buyInterestRate').value) || 8.5;
    const analysisPeriod = parseFloat(document.getElementById('analysisPeriod').value) || 10;
    
    if (!propertyPrice || !monthlyRent) {
        showNotification('Please enter property price and monthly rent', 'warning');
        return;
    }
    
    const loanAmount = propertyPrice - downPayment;
    const monthlyRate = (interestRate / 100) / 12;
    const numPayments = 20 * 12;
    const emi = (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / 
                (Math.pow(1 + monthlyRate, numPayments) - 1);
    
    const buyingCosts = {
        downPayment: downPayment,
        emiTotal: emi * (analysisPeriod * 12),
        registrationCosts: propertyPrice * 0.08,
        maintenanceTotal: (propertyPrice * 0.01) * analysisPeriod,
        total: 0
    };
    buyingCosts.total = buyingCosts.downPayment + buyingCosts.emiTotal + 
                       buyingCosts.registrationCosts + buyingCosts.maintenanceTotal;
    
    const rentingCosts = {
        totalRent: monthlyRent * 12 * analysisPeriod * 1.05,
        securityDeposit: monthlyRent * 3,
        brokerageTotal: monthlyRent * 2 * Math.ceil(analysisPeriod / 3),
        total: 0
    };
    rentingCosts.total = rentingCosts.totalRent + rentingCosts.securityDeposit;
    
    const difference = buyingCosts.total - rentingCosts.total;
    const recommendation = difference > 0 ? 'RENT' : 'BUY';
    const savingsAmount = Math.abs(difference);
    
    const resultsHTML = `
        <div class="comparison-result">
            <div class="recommendation-card" style="background: ${recommendation === 'RENT' ? '#10b981' : '#6366f1'}; color: white; padding: 1rem; border-radius: 8px; text-align: center; margin-bottom: 1rem;">
                <h3>💡 Recommendation: ${recommendation}</h3>
                <p>You can save <strong>${formatCurrency(savingsAmount)}</strong> by choosing to ${recommendation.toLowerCase()}</p>
            </div>
        </div>
        <div class="cost-comparison" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1rem;">
            <div class="cost-section" style="background: #f9fafb; padding: 1rem; border-radius: 8px;">
                <h4>🏠 Buying Costs (${analysisPeriod} years)</h4>
                <div class="breakdown-item">
                    <span>Down Payment:</span>
                    <strong>${formatCurrency(buyingCosts.downPayment)}</strong>
                </div>
                <div class="breakdown-item">
                    <span>EMI Payments:</span>
                    <strong>${formatCurrency(buyingCosts.emiTotal)}</strong>
                </div>
                <div class="breakdown-item">
                    <span>Registration & Costs:</span>
                    <strong>${formatCurrency(buyingCosts.registrationCosts)}</strong>
                </div>
                <div class="breakdown-item">
                    <span>Maintenance:</span>
                    <strong>${formatCurrency(buyingCosts.maintenanceTotal)}</strong>
                </div>
                <hr>
                <div class="breakdown-item">
                    <span><strong>Total Cost:</strong></span>
                    <strong>${formatCurrency(buyingCosts.total)}</strong>
                </div>
            </div>
            <div class="cost-section" style="background: #f9fafb; padding: 1rem; border-radius: 8px;">
                <h4>🔑 Renting Costs (${analysisPeriod} years)</h4>
                <div class="breakdown-item">
                    <span>Total Rent Payments:</span>
                    <strong>${formatCurrency(rentingCosts.totalRent)}</strong>
                </div>
                <div class="breakdown-item">
                    <span>Security Deposits:</span>
                    <strong>${formatCurrency(rentingCosts.securityDeposit)}</strong>
                </div>
                <div class="breakdown-item">
                    <span>Brokerage (Est.):</span>
                    <strong>${formatCurrency(rentingCosts.brokerageTotal)}</strong>
                </div>
                <hr>
                <div class="breakdown-item">
                    <span><strong>Total Cost:</strong></span>
                    <strong>${formatCurrency(rentingCosts.total)}</strong>
                </div>
            </div>
        </div>
    `;
    
    document.getElementById('rentVsBuyResults').innerHTML = resultsHTML;
    document.getElementById('rentVsBuyResults').style.display = 'block';
}

function findPropertyMatches() {
    showNotification('AI Property Matching feature coming soon!', 'info');
}

function calculateROI() {
    const purchasePrice = parseFloat(document.getElementById('purchasePrice').value);
    const rentalIncome = parseFloat(document.getElementById('rentalIncome').value);
    const maintenanceCost = parseFloat(document.getElementById('maintenanceCost').value) || 0;
    const appreciation = parseFloat(document.getElementById('appreciation').value) || 8;
    const holdingPeriod = parseFloat(document.getElementById('holdingPeriod').value) || 10;
    
    if (!purchasePrice || !rentalIncome) {
        showNotification('Please enter purchase price and rental income', 'warning');
        return;
    }
    
    const annualRent = rentalIncome * 12;
    const netRentalIncome = annualRent - maintenanceCost;
    const rentalYield = (netRentalIncome / purchasePrice) * 100;
    
    const futureValue = purchasePrice * Math.pow(1 + (appreciation / 100), holdingPeriod);
    const capitalGains = futureValue - purchasePrice;
    const totalReturns = (netRentalIncome * holdingPeriod) + capitalGains;
    const totalROI = ((totalReturns / purchasePrice) * 100);
    const annualizedROI = (Math.pow((futureValue / purchasePrice), (1 / holdingPeriod)) - 1) * 100;
    
    const resultsHTML = `
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
            <div class="result-card">
                <h4>Rental Yield</h4>
                <div class="result-value">${rentalYield.toFixed(1)}%</div>
            </div>
            <div class="result-card">
                <h4>Total ROI</h4>
                <div class="result-value">${totalROI.toFixed(1)}%</div>
            </div>
            <div class="result-card">
                <h4>Annualized Return</h4>
                <div class="result-value">${annualizedROI.toFixed(1)}%</div>
            </div>
            <div class="result-card">
                <h4>Future Property Value</h4>
                <div class="result-value">${formatCurrency(futureValue)}</div>
            </div>
        </div>
        <div class="recommendations">
            <h4>📊 Investment Analysis</h4>
            <ul>
                <li>Annual Rental Income: ${formatCurrency(netRentalIncome)}</li>
                <li>Total Rental Income (${holdingPeriod} years): ${formatCurrency(netRentalIncome * holdingPeriod)}</li>
                <li>Expected Capital Gains: ${formatCurrency(capitalGains)}</li>
                <li>Total Returns: ${formatCurrency(totalReturns)}</li>
            </ul>
        </div>
    `;
    
    document.getElementById('roiResults').innerHTML = resultsHTML;
    document.getElementById('roiResults').style.display = 'block';
}

// Utility Functions
function formatCurrency(amount) {
    if (amount >= 10000000) {
        return `₹${(amount / 10000000).toFixed(1)}Cr`;
    } else if (amount >= 100000) {
        return `₹${(amount / 100000).toFixed(1)}L`;
    } else {
        return `₹${Math.round(amount).toLocaleString('en-IN')}`;
    }
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <span>${message}</span>
            <button class="notification-close">&times;</button>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 5000);
    
    notification.querySelector('.notification-close').addEventListener('click', () => {
        notification.remove();
    });
}

function hideNotification(id) {
    const element = document.getElementById(id);
    if (element) {
        element.style.display = 'none';
    }
}

function addToRecentCalculations(type, data) {
    let recent = JSON.parse(localStorage.getItem('recent_calculations') || '[]');
    recent.unshift({
        type: type,
        data: data,
        timestamp: new Date().toISOString()
    });
    recent = recent.slice(0, 10);
    localStorage.setItem('recent_calculations', JSON.stringify(recent));
}

function loadUserPreferences() {
    const preferences = JSON.parse(localStorage.getItem('user_preferences') || '{}');
}

function showWelcomeMessage() {
    setTimeout(() => {
        showNotification('Welcome to Magic AI ✦! Your complete real estate toolkit is ready.', 'success');
        setTimeout(() => {
            if (chatWidget.style.display !== 'flex') {
                openChatWidget();
            }
        }, 2000);
    }, 1000);
}

function initializeTool(toolName) {
    switch(toolName) {
        case 'emi-calculator':
            ['loanAmount', 'interestRate', 'loanTenure'].forEach(id => {
                const element = document.getElementById(id);
                if (element) {
                    element.addEventListener('input', debounce(() => {
                        if (element.value) calculateEMI();
                    }, 500));
                }
            });
            break;
        default:
            break;
    }
}

function initializeTools() {
    console.log('Tools initialized');
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function handleScroll() {
    const header = document.querySelector('.header');
    if (window.scrollY > 100) {
        header.style.background = 'rgba(255, 255, 255, 0.98)';
        header.style.boxShadow = 'var(--shadow-md)';
    } else {
        header.style.background = 'rgba(255, 255, 255, 0.95)';
        header.style.boxShadow = 'var(--shadow-sm)';
    }
}

function handleResize() {
    if (window.innerWidth > 768) {
        navMenu.classList.remove('active');
    }
}

// Export functions for global access
window.openTool = openTool;
window.toggleChatWidget = toggleChatWidget;
window.sendQuickMessage = sendQuickMessage;
window.calculateEMI = calculateEMI;
window.checkLoanEligibility = checkLoanEligibility;
window.calculateAffordability = calculateAffordability;
window.analyzeRentVsBuy = analyzeRentVsBuy;
window.findPropertyMatches = findPropertyMatches;
window.calculateROI = calculateROI;

// Initialize everything when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        initializeApp();
        setupEventListeners();
        setupPWA();
        setupChatbot();
        setupToolCategories();
    });
} else {
    initializeApp();
    setupEventListeners();
    setupPWA();
    setupChatbot();
    setupToolCategories();
}

// Register Service Worker
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js')
        .then(registration => console.log('SW registered'))
        .catch(error => console.log('SW registration failed'));
}
