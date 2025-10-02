// Social Media Management Module
// Integrates content scheduling, automated posting, and engagement management

class SocialMediaManager {
  constructor() {
    this.LS_KEYS = {
      CONTENT_LIBRARY: 'ma:content:v1',
      SCHEDULED_POSTS: 'ma:scheduled_posts:v1',
      SOCIAL_COMMENTS: 'ma:comments:v1',
      SOCIAL_SETTINGS: 'ma:social_settings:v1',
      CALENDAR_EVENTS: 'ma:calendar_events:v1'
    };
    
    this.contentTypes = {
      POST: 'post',
      STORY: 'story',
      REEL: 'reel'
    };
    
    this.platforms = {
      INSTAGRAM: 'instagram',
      FACEBOOK: 'facebook',
      TWITTER: 'twitter'
    };
    
    this.init();
  }

  init() {
    console.log('📱 Initializing Social Media Manager...');
    this.setupEventListeners();
    this.initializeContentLibrary();
    this.setupScheduler();
    console.log('✅ Social Media Manager initialized');
  }

  // ---------- Content Library Management ----------
  
  initializeContentLibrary() {
    const library = this.getContentLibrary();
    if (library.length === 0) {
      // Initialize with sample content
      const sampleContent = [
        {
          id: this.generateId('content_'),
          title: 'Welcome to our restaurant!',
          description: 'Beautiful interior shot',
          mediaType: 'image',
          mediaUrl: '/assets/sample-restaurant.jpg',
          tags: ['interior', 'ambiance', 'welcome'],
          created: new Date().toISOString(),
          used: false
        },
        {
          id: this.generateId('content_'),
          title: 'Chef\'s Special',
          description: 'Today\'s featured dish',
          mediaType: 'image',
          mediaUrl: '/assets/sample-dish.jpg',
          tags: ['food', 'special', 'chef'],
          created: new Date().toISOString(),
          used: false
        }
      ];
      this.saveContentLibrary(sampleContent);
    }
  }

  getContentLibrary() {
    return this.lsRead(this.LS_KEYS.CONTENT_LIBRARY, []);
  }

  saveContentLibrary(library) {
    return this.lsWrite(this.LS_KEYS.CONTENT_LIBRARY, library);
  }

  addContent(content) {
    const library = this.getContentLibrary();
    const newContent = {
      id: this.generateId('content_'),
      ...content,
      created: new Date().toISOString(),
      used: false
    };
    library.push(newContent);
    this.saveContentLibrary(library);
    this.renderContentLibrary();
    
    if (window.legacyFeatures) {
      window.legacyFeatures.addLog({
        type: 'info',
        source: 'Social Media',
        text: `New content added: ${content.title}`
      });
    }
    
    return newContent;
  }

  // ---------- AI Caption Generation ----------
  async generateCaption(content, eventContext = null) {
    if (!window.restaurantApp?.apiClient) {
      throw new Error('API client not available');
    }

    const prompt = this.buildCaptionPrompt(content, eventContext);
    
    try {
      // Use our existing Mistral AI endpoint for caption generation
      const response = await window.restaurantApp.apiClient.sendTextConversation(prompt);
      
      const caption = this.extractCaptionFromResponse(response.aiResponse);
      
      if (window.legacyFeatures) {
        window.legacyFeatures.addLog({
          type: 'success',
          source: 'AI Caption',
          text: `Generated caption for: ${content.title}`
        });
      }
      
      return {
        caption: caption.text,
        hashtags: caption.hashtags,
        suggestedTime: this.getSuggestedPostTime()
      };
      
    } catch (error) {
      console.error('❌ Error generating caption:', error);
      if (window.legacyFeatures) {
        window.legacyFeatures.addLog({
          type: 'error',
          source: 'AI Caption',
          text: `Failed to generate caption: ${error.message}`
        });
      }
      throw error;
    }
  }

  buildCaptionPrompt(content, eventContext) {
    return `You are a social media manager for a restaurant. Generate an engaging Instagram caption and hashtags.

Content Details:
- Title: ${content.title}
- Description: ${content.description}
- Tags: ${content.tags?.join(', ') || 'None'}
- Media Type: ${content.mediaType}

${eventContext ? `Special Event Context: ${eventContext}` : ''}

Please generate:
1. An engaging caption (2-3 sentences, friendly tone)
2. Relevant hashtags (8-12 hashtags)
3. Include a call-to-action

Format your response as:
CAPTION: [your caption here]
HASHTAGS: [hashtags separated by spaces]`;
  }

  extractCaptionFromResponse(aiResponse) {
    const captionMatch = aiResponse.match(/CAPTION:\s*(.+?)(?=HASHTAGS:|$)/s);
    const hashtagsMatch = aiResponse.match(/HASHTAGS:\s*(.+)/s);
    
    return {
      text: captionMatch ? captionMatch[1].trim() : aiResponse.slice(0, 200),
      hashtags: hashtagsMatch ? hashtagsMatch[1].trim() : '#restaurant #food #delicious'
    };
  }

  getSuggestedPostTime() {
    // Suggest optimal posting times for restaurants
    const now = new Date();
    const times = [
      { hour: 11, minute: 30, label: 'Lunch prep' },
      { hour: 17, minute: 0, label: 'Dinner prep' },
      { hour: 19, minute: 30, label: 'Peak dinner' },
      { hour: 21, minute: 0, label: 'Evening crowd' }
    ];
    
    const nextTime = times.find(time => {
      const targetTime = new Date(now);
      targetTime.setHours(time.hour, time.minute, 0);
      return targetTime > now;
    }) || times[0];
    
    const suggestedTime = new Date(now);
    suggestedTime.setHours(nextTime.hour, nextTime.minute, 0);
    
    return {
      time: suggestedTime,
      reason: nextTime.label
    };
  }

  // ---------- Scheduled Posts Management ----------
  
  getScheduledPosts() {
    return this.lsRead(this.LS_KEYS.SCHEDULED_POSTS, []);
  }

  saveScheduledPosts(posts) {
    return this.lsWrite(this.LS_KEYS.SCHEDULED_POSTS, posts);
  }

  schedulePost(postData) {
    const posts = this.getScheduledPosts();
    const scheduledPost = {
      id: this.generateId('post_'),
      ...postData,
      created: new Date().toISOString(),
      status: 'scheduled'
    };
    
    posts.push(scheduledPost);
    this.saveScheduledPosts(posts);
    this.renderScheduledPosts();
    
    if (window.legacyFeatures) {
      window.legacyFeatures.addLog({
        type: 'info',
        source: 'Social Scheduler',
        text: `Post scheduled for ${new Date(postData.scheduledTime).toLocaleString()}`
      });
    }
    
    return scheduledPost;
  }

  // ---------- Comment/DM Management ----------
  
  getSocialComments() {
    return this.lsRead(this.LS_KEYS.SOCIAL_COMMENTS, []);
  }

  saveSocialComments(comments) {
    return this.lsWrite(this.LS_KEYS.SOCIAL_COMMENTS, comments);
  }

  async handleIncomingComment(commentData) {
    const comments = this.getSocialComments();
    
    // Analyze sentiment using our existing AI
    const sentiment = await this.analyzeSentiment(commentData.text);
    
    const comment = {
      id: this.generateId('comment_'),
      ...commentData,
      sentiment: sentiment.type,
      confidence: sentiment.confidence,
      needsApproval: sentiment.needsApproval,
      received: new Date().toISOString(),
      status: 'pending'
    };
    
    comments.unshift(comment);
    this.saveSocialComments(comments);
    
    // Auto-respond if confidence is high and positive
    if (!comment.needsApproval && sentiment.confidence > 0.8) {
      await this.generateAutoResponse(comment);
    }
    
    this.renderSocialComments();
    return comment;
  }

  async analyzeSentiment(text) {
    const prompt = `Analyze this social media comment for sentiment and determine if it needs human approval:

Comment: "${text}"

Classify as:
1. POSITIVE - Happy customer, compliment, thanks
2. QUESTION - Asking about hours, menu, reservations 
3. COMPLAINT - Negative experience, criticism
4. SPAM - Irrelevant, promotional, suspicious

Respond with:
SENTIMENT: [POSITIVE/QUESTION/COMPLAINT/SPAM]
CONFIDENCE: [0.1-1.0]
NEEDS_APPROVAL: [true/false]
REASON: [brief explanation]`;

    try {
      const response = await window.restaurantApp.apiClient.sendTextConversation(prompt);
      return this.parseSentimentResponse(response.aiResponse);
    } catch (error) {
      console.error('❌ Sentiment analysis error:', error);
      return {
        type: 'UNKNOWN',
        confidence: 0.3,
        needsApproval: true,
        reason: 'Analysis failed'
      };
    }
  }

  parseSentimentResponse(aiResponse) {
    const sentimentMatch = aiResponse.match(/SENTIMENT:\s*(\w+)/i);
    const confidenceMatch = aiResponse.match(/CONFIDENCE:\s*([0-9.]+)/i);
    const approvalMatch = aiResponse.match(/NEEDS_APPROVAL:\s*(true|false)/i);
    const reasonMatch = aiResponse.match(/REASON:\s*(.+)/i);
    
    const sentiment = sentimentMatch ? sentimentMatch[1].toUpperCase() : 'UNKNOWN';
    const confidence = confidenceMatch ? parseFloat(confidenceMatch[1]) : 0.5;
    const needsApproval = approvalMatch ? approvalMatch[1] === 'true' : true;
    
    return {
      type: sentiment,
      confidence,
      needsApproval: needsApproval || sentiment === 'COMPLAINT' || confidence < 0.7,
      reason: reasonMatch ? reasonMatch[1].trim() : 'Automatic analysis'
    };
  }

  async generateAutoResponse(comment) {
    const prompt = `Generate a professional, friendly response to this social media comment:

Original Comment: "${comment.text}"
Sentiment: ${comment.sentiment}
Platform: ${comment.platform || 'Instagram'}

Guidelines:
- Keep it brief and friendly
- Include restaurant name if appropriate
- For questions, provide helpful info or direct to contact
- For compliments, express gratitude
- Professional tone, warm personality

Response:`;

    try {
      const response = await window.restaurantApp.apiClient.sendTextConversation(prompt);
      
      comment.suggestedResponse = response.aiResponse.replace(/^Response:\s*/i, '').trim();
      comment.responseGenerated = new Date().toISOString();
      
      const comments = this.getSocialComments();
      const commentIndex = comments.findIndex(c => c.id === comment.id);
      if (commentIndex >= 0) {
        comments[commentIndex] = comment;
        this.saveSocialComments(comments);
      }
      
      return comment.suggestedResponse;
      
    } catch (error) {
      console.error('❌ Response generation error:', error);
      return null;
    }
  }

  // ---------- Event Integration ----------
  
  getCalendarEvents() {
    return this.lsRead(this.LS_KEYS.CALENDAR_EVENTS, []);
  }

  saveCalendarEvents(events) {
    return this.lsWrite(this.LS_KEYS.CALENDAR_EVENTS, events);
  }

  addCalendarEvent(eventData) {
    const events = this.getCalendarEvents();
    const event = {
      id: this.generateId('event_'),
      ...eventData,
      created: new Date().toISOString()
    };
    
    events.push(event);
    this.saveCalendarEvents(events);
    
    // Auto-suggest content for this event
    this.suggestContentForEvent(event);
    
    return event;
  }

  async suggestContentForEvent(event) {
    const library = this.getContentLibrary();
    const relevantContent = library.filter(content => {
      const eventTags = event.tags || [];
      const contentTags = content.tags || [];
      return eventTags.some(tag => contentTags.includes(tag)) || !content.used;
    });
    
    if (relevantContent.length > 0 && window.legacyFeatures) {
      window.legacyFeatures.addLog({
        type: 'info',
        source: 'Event Planner',
        text: `Found ${relevantContent.length} content pieces for event: ${event.title}`
      });
    }
    
    return relevantContent;
  }

  // ---------- UI Rendering Methods ----------
  
  renderContentLibrary() {
    const container = document.getElementById('social-content-library');
    if (!container) return;

    const library = this.getContentLibrary();
    
    if (library.length === 0) {
      container.innerHTML = `
        <div class="text-center text-gray-500 py-8">
          <svg class="w-16 h-16 mx-auto text-gray-300 mb-4" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clip-rule="evenodd"/>
          </svg>
          <h3 class="text-lg font-medium">No Content Yet</h3>
          <p class="text-sm">Upload images and videos to get started</p>
        </div>
      `;
      return;
    }

    container.innerHTML = library.map(content => `
      <div class="content-item p-4 border border-gray-200 rounded-lg hover:shadow-lg transition-shadow">
        <div class="aspect-w-16 aspect-h-9 mb-3">
          <div class="bg-gray-200 rounded flex items-center justify-center text-gray-500">
            ${content.mediaType === 'image' ? '📸' : '🎥'} ${content.mediaType}
          </div>
        </div>
        <h4 class="font-medium text-gray-900 mb-2">${content.title}</h4>
        <p class="text-sm text-gray-600 mb-2">${content.description}</p>
        <div class="flex flex-wrap gap-1 mb-3">
          ${(content.tags || []).map(tag => 
            `<span class="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">${tag}</span>`
          ).join('')}
        </div>
        <div class="flex justify-between items-center">
          <span class="text-xs text-gray-500">${this.friendlyDate(content.created)}</span>
          <button class="generate-post-btn text-blue-600 text-sm hover:text-blue-800" data-content-id="${content.id}">
            Generate Post
          </button>
        </div>
      </div>
    `).join('');

    // Attach event listeners
    container.querySelectorAll('.generate-post-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const contentId = e.target.dataset.contentId;
        this.openPostGenerator(contentId);
      });
    });
  }

  renderScheduledPosts() {
    const container = document.getElementById('scheduled-posts');
    if (!container) return;

    const posts = this.getScheduledPosts();
    
    if (posts.length === 0) {
      container.innerHTML = '<div class="text-center text-gray-500 py-4">No scheduled posts</div>';
      return;
    }

    container.innerHTML = posts.map(post => `
      <div class="scheduled-post p-3 border border-gray-200 rounded mb-2">
        <div class="flex justify-between items-start">
          <div>
            <h5 class="font-medium">${post.caption?.slice(0, 50)}...</h5>
            <p class="text-xs text-gray-500">${this.friendlyDate(post.scheduledTime)}</p>
          </div>
          <span class="text-xs px-2 py-1 rounded ${
            post.status === 'scheduled' ? 'bg-yellow-100 text-yellow-800' :
            post.status === 'posted' ? 'bg-green-100 text-green-800' :
            'bg-red-100 text-red-800'
          }">${post.status}</span>
        </div>
      </div>
    `).join('');
  }

  renderSocialComments() {
    const container = document.getElementById('social-comments');
    if (!container) return;

    const comments = this.getSocialComments();
    
    if (comments.length === 0) {
      container.innerHTML = '<div class="text-center text-gray-500 py-4">No comments yet</div>';
      return;
    }

    container.innerHTML = comments.slice(0, 10).map(comment => `
      <div class="comment-item p-3 border border-gray-200 rounded mb-2">
        <div class="flex justify-between items-start mb-2">
          <div>
            <span class="font-medium">${comment.author || 'Anonymous'}</span>
            <span class="text-xs px-2 py-1 rounded ml-2 ${
              comment.sentiment === 'POSITIVE' ? 'bg-green-100 text-green-800' :
              comment.sentiment === 'QUESTION' ? 'bg-blue-100 text-blue-800' :
              comment.sentiment === 'COMPLAINT' ? 'bg-red-100 text-red-800' :
              'bg-gray-100 text-gray-800'
            }">${comment.sentiment}</span>
          </div>
          <span class="text-xs text-gray-500">${this.friendlyDate(comment.received)}</span>
        </div>
        <p class="text-sm text-gray-700 mb-2">"${comment.text}"</p>
        ${comment.suggestedResponse ? `
          <div class="bg-blue-50 p-2 rounded text-sm">
            <strong>Suggested Response:</strong><br>
            ${comment.suggestedResponse}
          </div>
        ` : ''}
      </div>
    `).join('');
  }

  // ---------- Post Generator Modal ----------
  
  openPostGenerator(contentId) {
    const content = this.getContentLibrary().find(c => c.id === contentId);
    if (!content) return;

    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    modal.innerHTML = `
      <div class="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h3 class="text-lg font-bold mb-4">Generate Social Media Post</h3>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium mb-1">Content</label>
            <p class="text-sm text-gray-600">${content.title} - ${content.description}</p>
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">Platform</label>
            <select id="platform-select" class="w-full border border-gray-300 rounded px-3 py-2">
              <option value="instagram">Instagram</option>
              <option value="facebook">Facebook</option>
              <option value="twitter">Twitter</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">Post Type</label>
            <select id="type-select" class="w-full border border-gray-300 rounded px-3 py-2">
              <option value="post">Post</option>
              <option value="story">Story</option>
              <option value="reel">Reel</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">Schedule Time (Optional)</label>
            <input type="datetime-local" id="schedule-time" class="w-full border border-gray-300 rounded px-3 py-2">
          </div>
          <div class="flex justify-end space-x-3">
            <button id="cancel-generate" class="px-4 py-2 text-gray-600 hover:text-gray-800">Cancel</button>
            <button id="generate-caption" class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Generate Caption</button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Event listeners
    modal.querySelector('#cancel-generate').addEventListener('click', () => {
      modal.remove();
    });

    modal.querySelector('#generate-caption').addEventListener('click', async () => {
      const platform = modal.querySelector('#platform-select').value;
      const type = modal.querySelector('#type-select').value;
      const scheduleTime = modal.querySelector('#schedule-time').value;
      
      try {
        UIManager.showLoader('Generating caption...');
        const caption = await this.generateCaption(content);
        
        const postData = {
          contentId: content.id,
          platform,
          type,
          caption: caption.caption,
          hashtags: caption.hashtags,
          scheduledTime: scheduleTime || caption.suggestedTime.time.toISOString()
        };
        
        this.schedulePost(postData);
        modal.remove();
        UIManager.hideLoader();
        UIManager.showNotification('Post scheduled successfully!', 'success');
        
      } catch (error) {
        UIManager.hideLoader();
        UIManager.showNotification('Failed to generate caption: ' + error.message, 'error');
      }
    });

    // Close on backdrop click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.remove();
    });
  }

  // ---------- Setup & Event Listeners ----------
  
  setupEventListeners() {
    // Add content button
    const addContentBtn = document.getElementById('add-content-btn');
    if (addContentBtn) {
      addContentBtn.addEventListener('click', () => this.openAddContentModal());
    }

    // Add event button
    const addEventBtn = document.getElementById('add-event-btn');
    if (addEventBtn) {
      addEventBtn.addEventListener('click', () => this.openAddEventModal());
    }

    // Simulate incoming comments (for demo)
    const simulateCommentBtn = document.getElementById('simulate-comment-btn');
    if (simulateCommentBtn) {
      simulateCommentBtn.addEventListener('click', () => this.simulateIncomingComment());
    }
  }

  setupScheduler() {
    // Check for scheduled posts every minute
    setInterval(() => {
      this.checkScheduledPosts();
    }, 60000);
  }

  checkScheduledPosts() {
    const posts = this.getScheduledPosts();
    const now = new Date();
    
    posts.forEach(post => {
      if (post.status === 'scheduled' && new Date(post.scheduledTime) <= now) {
        this.executePost(post);
      }
    });
  }

  async executePost(post) {
    // In a real implementation, this would call Instagram/Facebook APIs
    console.log('📱 Executing scheduled post:', post);
    
    post.status = 'posted';
    post.postedTime = new Date().toISOString();
    
    const posts = this.getScheduledPosts();
    const index = posts.findIndex(p => p.id === post.id);
    if (index >= 0) {
      posts[index] = post;
      this.saveScheduledPosts(posts);
    }
    
    if (window.legacyFeatures) {
      window.legacyFeatures.addLog({
        type: 'success',
        source: 'Auto Poster',
        text: `Posted to ${post.platform}: ${post.caption.slice(0, 50)}...`
      });
    }
    
    this.renderScheduledPosts();
  }

  // ---------- Demo Functions ----------
  
  simulateIncomingComment() {
    const sampleComments = [
      { text: "Love your food! When are you open today?", author: "foodie_jane", platform: "instagram" },
      { text: "The service was terrible last night!", author: "unhappy_customer", platform: "facebook" },
      { text: "Do you have vegetarian options?", author: "veggie_lover", platform: "instagram" },
      { text: "Thanks for the amazing dinner! 😍", author: "happy_diner", platform: "instagram" }
    ];
    
    const randomComment = sampleComments[Math.floor(Math.random() * sampleComments.length)];
    this.handleIncomingComment(randomComment);
    
    UIManager.showNotification('New comment received!', 'info');
  }

  openAddContentModal() {
    // Placeholder for content upload modal
    UIManager.showNotification('Content upload modal - feature coming soon!', 'info');
  }

  openAddEventModal() {
    // Placeholder for event creation modal
    UIManager.showNotification('Event creation modal - feature coming soon!', 'info');
  }

  // ---------- Utility Methods ----------
  
  generateId(prefix = '') {
    return prefix + Math.random().toString(36).slice(2, 9);
  }

  friendlyDate(iso) {
    if (!iso) return '—';
    try { 
      return new Date(iso).toLocaleString(); 
    } catch { 
      return iso; 
    }
  }

  lsRead(key, defaultValue = null) {
    try {
      const v = localStorage.getItem(key);
      if (v === null || v === undefined) return defaultValue;
      return JSON.parse(v);
    } catch (e) {
      console.warn(`Error reading localStorage key "${key}":`, e);
      return defaultValue;
    }
  }

  lsWrite(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.error(`Error writing to localStorage key "${key}":`, e);
      return false;
    }
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  if (!window.socialMediaManager) {
    window.socialMediaManager = new SocialMediaManager();
  }
});

// Export for other modules
if (typeof window !== 'undefined') {
  window.SocialMediaManager = SocialMediaManager;
}