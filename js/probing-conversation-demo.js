/**
 * Probing Conversation Demo
 * Shows how the AI persistently asks questions until it has all booking information
 */

class ProbingConversationDemo {
    constructor() {
        this.demoScenarios = [
            {
                name: "Incomplete Initial Request",
                steps: [
                    {
                        user: "Hi, I need a table",
                        expectedResponse: "Hello! I'd be happy to help you make a reservation. To get started, could you please tell me your name, how many people will be joining you, and what date and time you'd prefer?"
                    }
                ]
            },
            {
                name: "Partial Information Given",
                steps: [
                    {
                        user: "Hi, I'm John Smith and I need a table for 4 people",
                        expectedResponse: "Great, John! I have you down for 4 people. What date would you like to dine with us?"
                    },
                    {
                        user: "Tomorrow evening",
                        expectedResponse: "Perfect! And what time tomorrow evening would work best for you? We're open from 5 PM to 11 PM."
                    },
                    {
                        user: "7 PM",
                        expectedResponse: "Excellent! I've reserved a table for John Smith, party of 4, tomorrow at 7:00 PM. Your confirmation number is BV123456. Thank you!"
                    }
                ]
            },
            {
                name: "Vague Request Requiring Multiple Probes",
                steps: [
                    {
                        user: "I want to book a table",
                        expectedResponse: "I'd be happy to help! To complete your reservation, I'll need a few details. First, what name should I put the reservation under?"
                    },
                    {
                        user: "Sarah",
                        expectedResponse: "Thank you, Sarah! How many people will be joining you?"
                    },
                    {
                        user: "Just me and my husband",
                        expectedResponse: "Perfect, a table for 2. What date would you like to dine with us?"
                    },
                    {
                        user: "This weekend",
                        expectedResponse: "Great! Which day this weekend - Saturday or Sunday? And what time would you prefer?"
                    },
                    {
                        user: "Saturday at 6:30",
                        expectedResponse: "Wonderful! I've confirmed your reservation for Sarah, party of 2, this Saturday at 6:30 PM. Your confirmation number is BV789012. Thank you!"
                    }
                ]
            },
            {
                name: "Customer Provides All Info at Once",
                steps: [
                    {
                        user: "Hi, I'm Mike Chen, I'd like a table for 6 people this Friday at 7:30 PM",
                        expectedResponse: "Perfect! I have everything I need. I've reserved a table for Mike Chen, party of 6, this Friday at 7:30 PM. Your confirmation number is BV345678. Thank you for choosing our restaurant!"
                    }
                ]
            }
        ];
        
        this.init();
    }

    init() {
        this.createDemoInterface();
        console.log('🎭 Probing Conversation Demo ready');
    }

    createDemoInterface() {
        const demoPanel = document.createElement('div');
        demoPanel.className = 'probing-demo-panel';
        demoPanel.innerHTML = `
            <div class="demo-header">
                <h3>🤖 AI Probing Conversation Demo</h3>
                <p>Watch how the AI persistently gathers all required booking information</p>
            </div>
            
            <div class="demo-content">
                <div class="scenario-selector">
                    <h4>Choose a Demo Scenario:</h4>
                    <div id="scenario-buttons" class="scenario-buttons">
                        ${this.demoScenarios.map((scenario, index) => `
                            <button class="scenario-btn" data-scenario="${index}">
                                ${scenario.name}
                            </button>
                        `).join('')}
                    </div>
                </div>
                
                <div id="demo-conversation" class="demo-conversation" style="display: none;">
                    <div class="conversation-header">
                        <h4 id="scenario-title">Demo Scenario</h4>
                        <button id="restart-demo" class="restart-btn">↻ Restart</button>
                    </div>
                    
                    <div id="conversation-messages" class="conversation-messages"></div>
                    
                    <div class="demo-controls">
                        <button id="next-step" class="next-btn">Next Step →</button>
                        <div class="step-counter">
                            Step <span id="current-step">1</span> of <span id="total-steps">1</span>
                        </div>
                    </div>
                </div>
                
                <div class="demo-explanation">
                    <h4>🎯 Key Features Demonstrated:</h4>
                    <ul>
                        <li><strong>Persistent Questioning:</strong> AI asks follow-up questions until all info is gathered</li>
                        <li><strong>Context Awareness:</strong> Remembers previous answers and builds on them</li>
                        <li><strong>Natural Conversation:</strong> Handles vague requests and clarifies specifics</li>
                        <li><strong>Complete Bookings:</strong> Only creates reservations when all details are confirmed</li>
                        <li><strong>Session Tracking:</strong> Maintains conversation state across multiple exchanges</li>
                    </ul>
                </div>
            </div>
        `;

        // Add styles
        this.addDemoStyles();
        
        // Insert into page
        document.body.appendChild(demoPanel);
        
        // Setup event listeners
        this.setupEventListeners();
    }

    addDemoStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .probing-demo-panel {
                background: white;
                border-radius: 16px;
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
                margin: 20px;
                padding: 24px;
                max-width: 700px;
            }
            
            .demo-header {
                text-align: center;
                margin-bottom: 24px;
                border-bottom: 2px solid #f1f5f9;
                padding-bottom: 16px;
            }
            
            .demo-header h3 {
                margin: 0 0 8px 0;
                color: #1e293b;
                font-size: 24px;
            }
            
            .demo-header p {
                margin: 0;
                color: #64748b;
                font-size: 16px;
            }
            
            .scenario-buttons {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 12px;
                margin-bottom: 20px;
            }
            
            .scenario-btn {
                padding: 12px 16px;
                background: linear-gradient(135deg, #6366f1, #4f46e5);
                color: white;
                border: none;
                border-radius: 8px;
                font-size: 14px;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.2s;
                text-align: left;
            }
            
            .scenario-btn:hover {
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
            }
            
            .conversation-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 16px;
            }
            
            .conversation-header h4 {
                margin: 0;
                color: #1e293b;
            }
            
            .restart-btn {
                padding: 6px 12px;
                background: #f1f5f9;
                border: 1px solid #cbd5e1;
                border-radius: 6px;
                cursor: pointer;
                font-size: 14px;
                transition: all 0.2s;
            }
            
            .restart-btn:hover {
                background: #e2e8f0;
            }
            
            .conversation-messages {
                background: #f8fafc;
                border-radius: 8px;
                padding: 16px;
                margin-bottom: 16px;
                min-height: 200px;
                max-height: 400px;
                overflow-y: auto;
            }
            
            .message {
                margin-bottom: 12px;
                padding: 10px 14px;
                border-radius: 12px;
                max-width: 85%;
                animation: messageAppear 0.3s ease-out;
            }
            
            .message.user {
                background: #3b82f6;
                color: white;
                margin-left: auto;
                border-bottom-right-radius: 4px;
            }
            
            .message.assistant {
                background: white;
                border: 1px solid #e2e8f0;
                border-bottom-left-radius: 4px;
                color: #1e293b;
            }
            
            .message-label {
                font-size: 11px;
                font-weight: 600;
                text-transform: uppercase;
                opacity: 0.7;
                margin-bottom: 4px;
            }
            
            .message-text {
                font-size: 14px;
                line-height: 1.4;
            }
            
            .demo-controls {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 20px;
            }
            
            .next-btn {
                padding: 12px 24px;
                background: linear-gradient(135deg, #10b981, #059669);
                color: white;
                border: none;
                border-radius: 8px;
                font-size: 16px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.2s;
            }
            
            .next-btn:hover {
                transform: translateY(-1px);
                box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
            }
            
            .next-btn:disabled {
                background: #9ca3af;
                cursor: not-allowed;
                transform: none;
                box-shadow: none;
            }
            
            .step-counter {
                font-size: 14px;
                color: #64748b;
                font-weight: 500;
            }
            
            .demo-explanation {
                background: #f0fdf4;
                border: 1px solid #bbf7d0;
                border-radius: 8px;
                padding: 16px;
            }
            
            .demo-explanation h4 {
                margin: 0 0 12px 0;
                color: #166534;
            }
            
            .demo-explanation ul {
                margin: 0;
                padding-left: 20px;
            }
            
            .demo-explanation li {
                margin-bottom: 6px;
                color: #14532d;
                line-height: 1.4;
            }
            
            @keyframes messageAppear {
                from {
                    opacity: 0;
                    transform: translateY(10px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
        `;
        document.head.appendChild(style);
    }

    setupEventListeners() {
        // Scenario selection
        document.getElementById('scenario-buttons').addEventListener('click', (e) => {
            if (e.target.classList.contains('scenario-btn')) {
                const scenarioIndex = parseInt(e.target.dataset.scenario);
                this.startScenario(scenarioIndex);
            }
        });

        // Next step
        document.getElementById('next-step').addEventListener('click', () => {
            this.nextStep();
        });

        // Restart demo
        document.getElementById('restart-demo').addEventListener('click', () => {
            this.restartDemo();
        });
    }

    startScenario(scenarioIndex) {
        this.currentScenario = this.demoScenarios[scenarioIndex];
        this.currentStepIndex = 0;
        
        // Show conversation panel
        document.getElementById('demo-conversation').style.display = 'block';
        document.getElementById('scenario-title').textContent = this.currentScenario.name;
        document.getElementById('total-steps').textContent = this.currentScenario.steps.length;
        
        // Clear messages
        document.getElementById('conversation-messages').innerHTML = '';
        
        // Update step counter
        this.updateStepCounter();
        
        console.log('🎭 Started demo scenario:', this.currentScenario.name);
    }

    nextStep() {
        if (!this.currentScenario || this.currentStepIndex >= this.currentScenario.steps.length) {
            return;
        }

        const step = this.currentScenario.steps[this.currentStepIndex];
        const messagesContainer = document.getElementById('conversation-messages');
        
        // Add user message
        messagesContainer.innerHTML += `
            <div class="message user">
                <div class="message-label">Customer</div>
                <div class="message-text">${step.user}</div>
            </div>
        `;
        
        // Add AI response after a delay for realism
        setTimeout(() => {
            messagesContainer.innerHTML += `
                <div class="message assistant">
                    <div class="message-label">AI Assistant</div>
                    <div class="message-text">${step.expectedResponse}</div>
                </div>
            `;
            
            // Scroll to bottom
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }, 800);

        this.currentStepIndex++;
        this.updateStepCounter();
        
        // Disable next button if we're done
        if (this.currentStepIndex >= this.currentScenario.steps.length) {
            setTimeout(() => {
                document.getElementById('next-step').disabled = true;
                document.getElementById('next-step').textContent = 'Demo Complete ✓';
            }, 1000);
        }
    }

    updateStepCounter() {
        document.getElementById('current-step').textContent = this.currentStepIndex + 1;
    }

    restartDemo() {
        document.getElementById('demo-conversation').style.display = 'none';
        this.currentScenario = null;
        this.currentStepIndex = 0;
        
        // Re-enable next button
        const nextBtn = document.getElementById('next-step');
        nextBtn.disabled = false;
        nextBtn.textContent = 'Next Step →';
    }

    // Test the actual conversation system
    async testLiveConversation() {
        console.log('🧪 Testing live probing conversation...');
        
        // This would test the actual server endpoint
        const testCases = [
            "I need a table",
            "Hi, I'm John Smith and I need a table for 4 people",
            "Tomorrow evening",
            "7 PM"
        ];
        
        for (const input of testCases) {
            try {
                const response = await fetch('/api/text-conversation', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        transcript: input,
                        sessionId: 'test-session-' + Date.now()
                    })
                });
                
                const result = await response.json();
                console.log(`Input: "${input}"`);
                console.log(`AI Response: "${result.aiResponse}"`);
                console.log(`Action: ${result.action}`);
                console.log('---');
                
            } catch (error) {
                console.error('Test failed:', error);
            }
        }
    }
}

// Initialize the demo
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        window.probingDemo = new ProbingConversationDemo();
    }, 1000);
});

// Export for manual testing
window.ProbingConversationDemo = ProbingConversationDemo;

console.log('🎭 Probing Conversation Demo loaded');