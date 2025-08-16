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
    // Check if user has visited before
    const isFirstVisit = !localStorage.getItem('magicai_visited');
    if (isFirstVisit) {
        localStorage.setItem('magicai_visited', 'true');
        showWelcomeMessage();
    }

    // Load user preferences
    loadUserPreferences();
    
    // Initialize tools
    initializeTools();
    
    // Check for updates
    checkForUpdates();
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
    // Initialize chat with welcome message
    addBotMessage("Hello! I'm your AI real estate assistant. Ask me anything about properties, loans, investments, or use our tools!");
    
    // Add quick action buttons
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
            <img src="https://i.postimg.cc/YSJdVQjb/Your-paragraph-text-1.png" alt="AI">
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
    // Show typing indicator
    showTypingIndicator();
    
    // Simulate AI processing delay
    setTimeout(() => {
        hideTypingIndicator();
        generateAIResponse(message);
    }, 1000 + Math.random() * 2000);
}

function generateAIResponse(message) {
    const lowerMessage = message.toLowerCase();
    let response = '';
    let actions = [];
    
    // Intent recognition and responses
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
        // Default response with popular tools
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
            <img src="https://i.postimg.cc/YSJdVQjb/Your-paragraph-text-1.png" alt="AI">
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
            const transcript = event.results[0].transcript;
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
    // Show buyer tools by default
    switchToolCategory('buyer');
}

function switchToolCategory(category) {
    // Hide all tool grids
    document.querySelectorAll('.tool-grid').forEach(grid => {
        grid.style.display = 'none';
    });
    
    // Show selected category
    const targetGrid = document.getElementById(`${category}-tools`);
    if (targetGrid) {
        targetGrid.style.display = 'grid';
    }
    
    // Update active tab
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    const activeTab = document.querySelector(`[data-category="${category}"]`);
    if (activeTab) {
        activeTab.classList.add('active');
    }
    
    activeToolCategory = category;
}

// Tool Modal Functions
function openTool(toolName) {
    const toolData = getToolData(toolName);
    if (toolData) {
        modalTitle.textContent = toolData.title;
        modalBody.innerHTML = toolData.content;
        toolModal.style.display = 'block';
        
        // Initialize tool functionality
        initializeTool(toolName);
    }
}

function closeModal() {
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
                        <div class="breakdown-chart">
                            <canvas id="emiChart" width="400" height="200"></canvas>
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
                    <div class="comparison-inputs">
                        <div class="comparison-section">
                            <h4><i class="fas fa-home"></i> Buying Option</h4>
                            <div class="input-group">
                                <label>Property Price (₹)</label>
                                <input type="number" id="propertyPrice" placeholder="e.g., 5000000" min="500000">
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
                                <label>Loan Tenure (Years)</label>
                                <input type="number" id="buyTenure" placeholder="20" min="1" max="30">
                            </div>
                        </div>
                        <div class="comparison-section">
                            <h4><i class="fas fa-key"></i> Renting Option</h4>
                            <div class="input-group">
                                <label>Monthly Rent (₹)</label>
                                <input type="number" id="monthlyRent" placeholder="e.g., 25000" min="5000">
                            </div>
                            <div class="input-group">
                                <label>Security Deposit (₹)</label>
                                <input type="number" id="securityDeposit" placeholder="e.g., 100000" min="0">
                            </div>
                            <div class="input-group">
                                <label>Annual Rent Increase (%)</label>
                                <input type="number" id="rentIncrease" placeholder="5" min="0" max="20" value="5">
                            </div>
                        </div>
                    </div>
                    <div class="input-group">
                        <label>Analysis Period (Years)</label>
                        <input type="number" id="analysisPeriod" placeholder="10" min="1" max="30" value="10">
                    </div>
                    <button class="tool-action-btn" onclick="analyzeRentVsBuy()">
                        <i class="fas fa-balance-scale"></i> Analyze Options
                    </button>
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
                            <label>Maximum Commute Time to Work (minutes)</label>
                            <input type="number" id="commuteTime" placeholder="45" min="0" max="180">
                        </div>
                        <div class="input-group">
                            <label>Work Location</label>
                            <input type="text" id="workLocation" placeholder="e.g., BKC, Lower Parel">
                        </div>
                        <div class="preferences-group">
                            <label>Preferences (Select all that apply)</label>
                            <div class="checkbox-group">
                                <label class="checkbox-item">
                                    <input type="checkbox" id="nearMetro"> Near Metro Station
                                </label>
                                <label class="checkbox-item">
                                    <input type="checkbox" id="goodSchools"> Good Schools Nearby
                                </label>
                                <label class="checkbox-item">
                                    <input type="checkbox" id="shopping"> Shopping Centers
                                </label>
                                <label class="checkbox-item">
                                    <input type="checkbox" id="hospitals"> Hospitals Nearby
                                </label>
                                <label class="checkbox-item">
                                    <input type="checkbox" id="parks"> Parks & Recreation
                                </label>
                                <label class="checkbox-item">
                                    <input type="checkbox" id="newConstruction"> New Construction
                                </label>
                            </div>
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
        'neighborhood-insights': {
            title: 'Neighborhood Insights',
            content: `
                <div class="tool-container">
                    <div class="input-section">
                        <div class="input-group">
                            <label>Enter Location</label>
                            <input type="text" id="locationInput" placeholder="e.g., Bandra West, Mumbai">
                        </div>
                        <button class="tool-action-btn" onclick="getNeighborhoodInsights()">
                            <i class="fas fa-map-marked-alt"></i> Get Insights
                        </button>
                    </div>
                    <div class="result-section" id="neighborhoodResults" style="display: none;">
                        <!-- Neighborhood data will be populated here -->
                    </div>
                </div>
            `
        },
        'property-comparison': {
            title: 'Property Comparison Tool',
            content: `
                <div class="tool-container">
                    <div class="comparison-setup">
                        <p>Compare up to 3 properties side by side</p>
                        <button class="add-property-btn" onclick="addPropertyComparison()">
                            <i class="fas fa-plus"></i> Add Property
                        </button>
                    </div>
                    <div class="properties-comparison" id="propertiesComparison">
                        <!-- Property comparison cards will be added here -->
                    </div>
                    <div class="comparison-results" id="comparisonResults" style="display: none;">
                        <!-- Comparison analysis will be shown here -->
                    </div>
                </div>
            `
        },
        'price-prediction': {
            title: 'AI Price Prediction Tool',
            content: `
                <div class="tool-container">
                    <div class="input-section">
                        <div class="input-group">
                            <label>Property Location</label>
                            <input type="text" id="predictionLocation" placeholder="e.g., Andheri East, Mumbai">
                        </div>
                        <div class="input-group">
                            <label>Property Type</label>
                            <select id="predictionPropertyType">
                                <option value="apartment">Apartment</option>
                                <option value="villa">Villa/House</option>
                                <option value="commercial">Commercial</option>
                            </select>
                        </div>
                        <div class="input-group">
                            <label>Current Property Value (₹)</label>
                            <input type="number" id="currentValue" placeholder="e.g., 5000000" min="500000">
                        </div>
                        <div class="input-group">
                            <label>Prediction Period</label>
                            <select id="predictionPeriod">
                                <option value="1">1 Year</option>
                                <option value="3">3 Years</option>
                                <option value="5" selected>5 Years</option>
                                <option value="10">10 Years</option>
                            </select>
                        </div>
                        <button class="tool-action-btn" onclick="predictPrices()">
                            <i class="fas fa-chart-line"></i> Predict Future Prices
                        </button>
                    </div>
                    <div class="result-section" id="predictionResults" style="display: none;">
                        <!-- Price predictions will be shown here -->
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
                            <input type="number" id="monthlyRent" placeholder="e.g., 25000" min="0">
                        </div>
                        <div class="input-group">
                            <label>Annual Maintenance Cost (₹)</label>
                            <input type="number" id="maintenanceCost" placeholder="e.g., 50000" min="0">
                        </div>
                        <div class="input-group">
                            <label>Property Tax (Annual) (₹)</label>
                            <input type="number" id="propertyTax" placeholder="e.g., 25000" min="0">
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
        },
        'growth-heatmap': {
            title: 'Growth Areas Heatmap',
            content: `
                <div class="tool-container">
                    <div class="input-section">
                        <div class="input-group">
                            <label>Select City</label>
                            <select id="heatmapCity">
                                <option value="mumbai">Mumbai</option>
                                <option value="delhi">Delhi NCR</option>
                                <option value="bangalore">Bangalore</option>
                                <option value="pune">Pune</option>
                                <option value="hyderabad">Hyderabad</option>
                                <option value="chennai">Chennai</option>
                            </select>
                        </div>
                        <div class="input-group">
                            <label>Investment Budget Range (₹)</label>
                            <select id="heatmapBudget">
                                <option value="0-2000000">Under 20 Lakhs</option>
                                <option value="2000000-5000000">20L - 50L</option>
                                <option value="5000000-10000000" selected>50L - 1Cr</option>
                                <option value="10000000-20000000">1Cr - 2Cr</option>
                                <option value="20000000+">Above 2Cr</option>
                            </select>
                        </div>
                        <button class="tool-action-btn" onclick="generateHeatmap()">
                            <i class="fas fa-fire"></i> Generate Heatmap
                        </button>
                    </div>
                    <div class="result-section" id="heatmapResults" style="display: none;">
                        <!-- Heatmap visualization will be shown here -->
                    </div>
                </div>
            `
        },
        'rental-forecaster': {
            title: 'Rental Income Forecaster',
            content: `
                <div class="tool-container">
                    <div class="input-section">
                        <div class="input-group">
                            <label>Property Location</label>
                            <input type="text" id="rentalLocation" placeholder="e.g., Powai, Mumbai">
                        </div>
                        <div class="input-group">
                            <label>Property Type & Size</label>
                            <select id="rentalPropertyType">
                                <option value="1bhk">1 BHK Apartment</option>
                                <option value="2bhk" selected>2 BHK Apartment</option>
                                <option value="3bhk">3 BHK Apartment</option>
                                <option value="4bhk">4+ BHK Apartment</option>
                                <option value="villa">Independent House/Villa</option>
                            </select>
                        </div>
                        <div class="input-group">
                            <label>Current Market Rent (₹/month)</label>
                            <input type="number" id="currentRent" placeholder="e.g., 30000" min="5000">
                        </div>
                        <div class="input-group">
                            <label>Forecast Period</label>
                            <select id="forecastPeriod">
                                <option value="2">2 Years</option>
                                <option value="5" selected>5 Years</option>
                                <option value="10">10 Years</option>
                            </select>
                        </div>
                        <button class="tool-action-btn" onclick="forecastRental()">
                            <i class="fas fa-chart-line"></i> Forecast Rental Growth
                        </button>
                    </div>
                    <div class="result-section" id="rentalResults" style="display: none;">
                        <!-- Rental forecast will be shown here -->
                    </div>
                </div>
            `
        },
        'development-tracker': {
            title: 'Future Development Tracker',
            content: `
                <div class="tool-container">
                    <div class="input-section">
                        <div class="input-group">
                            <label>Search Location</label>
                            <input type="text" id="developmentLocation" placeholder="e.g., Thane, Mumbai">
                        </div>
                        <div class="input-group">
                            <label>Development Type</label>
                            <div class="checkbox-group">
                                <label class="checkbox-item">
                                    <input type="checkbox" id="metroLines" checked> Metro/Railway Lines
                                </label>
                                <label class="checkbox-item">
                                    <input type="checkbox" id="highways" checked> Highways & Roads
                                </label>
                                <label class="checkbox-item">
                                    <input type="checkbox" id="airports"> Airports
                                </label>
                                <label class="checkbox-item">
                                    <input type="checkbox" id="malls"> Shopping Malls
                                </label>
                                <label class="checkbox-item">
                                    <input type="checkbox" id="itParks"> IT Parks/SEZ
                                </label>
                                <label class="checkbox-item">
                                    <input type="checkbox" id="schools"> Educational Institutes
                                </label>
                            </div>
                        </div>
                        <div class="input-group">
                            <label>Timeline</label>
                            <select id="developmentTimeline">
                                <option value="1">Next 1 Year</option>
                                <option value="3" selected>Next 3 Years</option>
                                <option value="5">Next 5 Years</option>
                                <option value="10">Next 10 Years</option>
                            </select>
                        </div>
                        <button class="tool-action-btn" onclick="trackDevelopments()">
                            <i class="fas fa-road"></i> Track Future Developments
                        </button>
                    </div>
                    <div class="result-section" id="developmentResults" style="display: none;">
                        <!-- Development tracking results will be shown here -->
                    </div>
                </div>
            `
        }
    };
    
    return tools[toolName] || null;
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
    
    // Add to recent calculations
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
    const maxEMI = availableIncome * 0.5; // 50% of available income
    
    // Credit score multiplier
    let creditMultiplier = 1.0;
    if (creditScore === '750-900') creditMultiplier = 1.2;
    else if (creditScore === '650-749') creditMultiplier = 1.0;
    else if (creditScore === '550-649') creditMultiplier = 0.8;
    else creditMultiplier = 0.6;
    
    // Employment type multiplier
    let empMultiplier = employmentType === 'salaried' ? 1.0 : 0.9;
    
    const maxLoanAmount = maxEMI * creditMultiplier * empMultiplier * 12 * 20 / 0.08; // Rough calculation
    
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
            <div class="eligibility-status" style="background-color: ${statusColor}">
                <h4>Eligibility Status: ${eligibilityStatus}</h4>
            </div>
        </div>
        <div class="eligibility-details">
            <div class="detail-card">
                <h4>Maximum EMI Capacity</h4>
                <div class="detail-value">${formatCurrency(maxEMI)}</div>
            </div>
            <div class="detail-card">
                <h4>Estimated Loan Amount</h4>
                <div class="detail-value">${formatCurrency(maxLoanAmount)}</div>
            </div>
            <div class="detail-card">
                <h4>Available Monthly Income</h4>
                <div class="detail-value">${formatCurrency(availableIncome)}</div>
            </div>
        </div>
        <div class="recommendations">
            <h4>Recommendations</h4>
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

// Utility Functions
function formatCurrency(amount) {
    if (amount >= 10000000) {
        return `₹${(amount / 10000000).toFixed(1)}Cr`;
    } else if (amount >= 100000) {
        return `₹${(amount / 100000).toFixed(1)}L`;
    } else {
        return `₹${amount.toLocaleString('en-IN')}`;
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
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 5000);
    
    // Close button functionality
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
    
    // Keep only last 10 calculations
    recent = recent.slice(0, 10);
    localStorage.setItem('recent_calculations', JSON.stringify(recent));
}

function loadUserPreferences() {
    // Load user preferences from localStorage
    const preferences = JSON.parse(localStorage.getItem('user_preferences') || '{}');
    // Apply preferences
}

function checkForUpdates() {
    // Check for app updates
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({command: 'checkForUpdates'});
    }
}

function showWelcomeMessage() {
    // Show welcome message for first-time users
    setTimeout(() => {
        showNotification('Welcome to Magic AI ✦! Your complete real estate toolkit is ready.', 'success');
        // Auto-open chat with welcome message
        setTimeout(() => {
            if (chatWidget.style.display !== 'flex') {
                openChatWidget();
            }
        }, 2000);
    }, 1000);
}

function initializeTool(toolName) {
    // Initialize specific tool functionality
    switch(toolName) {
        case 'emi-calculator':
            // Add real-time calculation
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
    // Handle responsive behavior
    if (window.innerWidth > 768) {
        navMenu.classList.remove('active');
    }
}

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

// Export functions for global access
window.openTool = openTool;
window.toggleChatWidget = toggleChatWidget;
window.sendQuickMessage = sendQuickMessage;
window.calculateEMI = calculateEMI;
window.checkLoanEligibility = checkLoanEligibility;
