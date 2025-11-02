// Converted from social-media-manager.js — inlined TypeScript implementation
// @ts-nocheck

class SocialMediaManager {
	LS_KEYS: any;
	contentTypes: any;
	platforms: any;

	constructor() {
		this.LS_KEYS = { CONTENT_LIBRARY: 'ma:content:v1', SCHEDULED_POSTS: 'ma:scheduled_posts:v1', SOCIAL_COMMENTS: 'ma:comments:v1', SOCIAL_SETTINGS: 'ma:social_settings:v1', CALENDAR_EVENTS: 'ma:calendar_events:v1' };
		this.contentTypes = { POST: 'post', STORY: 'story', REEL: 'reel' };
		this.platforms = { INSTAGRAM: 'instagram', FACEBOOK: 'facebook', TWITTER: 'twitter' };
		this.init();
	}

	init() { console.log('📱 Initializing Social Media Manager...'); this.setupEventListeners(); this.initializeContentLibrary(); this.setupScheduler(); console.log('✅ Social Media Manager initialized'); }

	initializeContentLibrary() { const library = this.getContentLibrary(); if (library.length === 0) { const sampleContent = [{ id: this.generateId('content_'), title: 'Welcome to our restaurant!', description: 'Beautiful interior shot', mediaType: 'image', mediaUrl: '/assets/sample-restaurant.jpg', tags: ['interior','ambiance','welcome'], created: new Date().toISOString(), used: false }, { id: this.generateId('content_'), title: "Chef's Special", description: "Today's featured dish", mediaType: 'image', mediaUrl: '/assets/sample-dish.jpg', tags: ['food','special','chef'], created: new Date().toISOString(), used: false }]; this.saveContentLibrary(sampleContent); } }

	getContentLibrary() { return this.lsRead(this.LS_KEYS.CONTENT_LIBRARY, []); }
	saveContentLibrary(library: any) { return this.lsWrite(this.LS_KEYS.CONTENT_LIBRARY, library); }

	addContent(content: any) { const library = this.getContentLibrary(); const newContent = { id: this.generateId('content_'), ...content, created: new Date().toISOString(), used: false }; library.push(newContent); this.saveContentLibrary(library); this.renderContentLibrary(); (window as any).legacyFeatures?.addLog?.({ type: 'info', source: 'Social Media', text: `New content added: ${content.title}` }); return newContent; }

	async generateCaption(content: any, eventContext: any = null) { if (!(window as any).restaurantApp?.apiClient) throw new Error('API client not available'); const prompt = this.buildCaptionPrompt(content, eventContext); try { const response = await (window as any).restaurantApp.apiClient.sendTextConversation(prompt); const caption = this.extractCaptionFromResponse(response.aiResponse); (window as any).legacyFeatures?.addLog?.({ type: 'success', source: 'AI Caption', text: `Generated caption for: ${content.title}` }); return { caption: caption.text, hashtags: caption.hashtags, suggestedTime: this.getSuggestedPostTime() }; } catch (error) { console.error('❌ Error generating caption:', error); (window as any).legacyFeatures?.addLog?.({ type: 'error', source: 'AI Caption', text: `Failed to generate caption: ${error.message}` }); throw error; } }

	buildCaptionPrompt(content: any, eventContext: any) { return `You are a social media manager for a restaurant. Generate an engaging Instagram caption and hashtags.\n\nContent Details:\n- Title: ${content.title}\n- Description: ${content.description}\n- Tags: ${content.tags?.join(', ') || 'None'}\n- Media Type: ${content.mediaType}\n\n${eventContext ? `Special Event Context: ${eventContext}` : ''}\n\nPlease generate:\n1. An engaging caption (2-3 sentences, friendly tone)\n2. Relevant hashtags (8-12 hashtags)\n3. Include a call-to-action\n\nFormat your response as:\nCAPTION: [your caption here]\nHASHTAGS: [hashtags separated by spaces]`; }

	extractCaptionFromResponse(aiResponse: string) { const captionMatch = aiResponse.match(/CAPTION:\s*(.+?)(?=HASHTAGS:|$)/s); const hashtagsMatch = aiResponse.match(/HASHTAGS:\s*(.+)/s); return { text: captionMatch ? captionMatch[1].trim() : aiResponse.slice(0,200), hashtags: hashtagsMatch ? hashtagsMatch[1].trim() : '#restaurant #food #delicious' }; }

	getSuggestedPostTime() { const now = new Date(); const times = [{ hour: 11, minute: 30, label: 'Lunch prep' }, { hour: 17, minute: 0, label: 'Dinner prep' }, { hour: 19, minute: 30, label: 'Peak dinner' }, { hour: 21, minute: 0, label: 'Evening crowd' }]; const nextTime = times.find(t => { const target = new Date(now); target.setHours(t.hour, t.minute, 0); return target > now; }) || times[0]; const suggestedTime = new Date(now); suggestedTime.setHours(nextTime.hour, nextTime.minute, 0); return { time: suggestedTime, reason: nextTime.label }; }

	getScheduledPosts() { return this.lsRead(this.LS_KEYS.SCHEDULED_POSTS, []); }
	saveScheduledPosts(posts: any) { return this.lsWrite(this.LS_KEYS.SCHEDULED_POSTS, posts); }

	schedulePost(postData: any) { const posts = this.getScheduledPosts(); const scheduledPost = { id: this.generateId('post_'), ...postData, created: new Date().toISOString(), status: 'scheduled' }; posts.push(scheduledPost); this.saveScheduledPosts(posts); this.renderScheduledPosts(); (window as any).legacyFeatures?.addLog?.({ type: 'info', source: 'Social Scheduler', text: `Post scheduled for ${new Date(postData.scheduledTime).toLocaleString()}` }); return scheduledPost; }

	getSocialComments() { return this.lsRead(this.LS_KEYS.SOCIAL_COMMENTS, []); }
	saveSocialComments(comments: any) { return this.lsWrite(this.LS_KEYS.SOCIAL_COMMENTS, comments); }

	async handleIncomingComment(commentData: any) { const comments = this.getSocialComments(); const sentiment = await this.analyzeSentiment(commentData.text); const comment = { id: this.generateId('comment_'), ...commentData, sentiment: sentiment.type, confidence: sentiment.confidence, needsApproval: sentiment.needsApproval, received: new Date().toISOString(), status: 'pending' }; comments.unshift(comment); this.saveSocialComments(comments); if (!comment.needsApproval && sentiment.confidence > 0.8) await this.generateAutoResponse(comment); this.renderSocialComments(); return comment; }

	async analyzeSentiment(text: string) { const prompt = `Analyze this social media comment for sentiment and determine if it needs human approval:\n\nComment: "${text}"\n\nClassify as:\n1. POSITIVE - Happy customer, compliment, thanks\n2. QUESTION - Asking about hours, menu, reservations \n3. COMPLAINT - Negative experience, criticism\n4. SPAM - Irrelevant, promotional, suspicious\n\nRespond with:\nSENTIMENT: [POSITIVE/QUESTION/COMPLAINT/SPAM]\nCONFIDENCE: [0.1-1.0]\nNEEDS_APPROVAL: [true/false]\nREASON: [brief explanation]`; try { const response = await (window as any).restaurantApp.apiClient.sendTextConversation(prompt); return this.parseSentimentResponse(response.aiResponse); } catch (error) { console.error('❌ Sentiment analysis error:', error); return { type: 'UNKNOWN', confidence: 0.3, needsApproval: true, reason: 'Analysis failed' }; } }

	parseSentimentResponse(aiResponse: string) { const sentimentMatch = aiResponse.match(/SENTIMENT:\s*(\w+)/i); const confidenceMatch = aiResponse.match(/CONFIDENCE:\s*([0-9.]+)/i); const approvalMatch = aiResponse.match(/NEEDS_APPROVAL:\s*(true|false)/i); const reasonMatch = aiResponse.match(/REASON:\s*(.+)/i); const sentiment = sentimentMatch ? sentimentMatch[1].toUpperCase() : 'UNKNOWN'; const confidence = confidenceMatch ? parseFloat(confidenceMatch[1]) : 0.5; const needsApproval = approvalMatch ? approvalMatch[1] === 'true' : true; return { type: sentiment, confidence, needsApproval: needsApproval || sentiment === 'COMPLAINT' || confidence < 0.7, reason: reasonMatch ? reasonMatch[1].trim() : 'Automatic analysis' }; }

	async generateAutoResponse(comment: any) { const prompt = `Generate a professional, friendly response to this social media comment:\n\nOriginal Comment: "${comment.text}"\nSentiment: ${comment.sentiment}\nPlatform: ${comment.platform || 'Instagram'}\n\nGuidelines:\n- Keep it brief and friendly\n- Include restaurant name if appropriate\n- For questions, provide helpful info or direct to contact\n- For compliments, express gratitude\n- Professional tone, warm personality\n\nResponse:`; try { const response = await (window as any).restaurantApp.apiClient.sendTextConversation(prompt); comment.suggestedResponse = response.aiResponse.replace(/^Response:\s*/i, '').trim(); comment.responseGenerated = new Date().toISOString(); const comments = this.getSocialComments(); const commentIndex = comments.findIndex((c: any) => c.id === comment.id); if (commentIndex >= 0) { comments[commentIndex] = comment; this.saveSocialComments(comments); } return comment.suggestedResponse; } catch (error) { console.error('❌ Response generation error:', error); return null; } }

	// UI rendering helpers omitted for brevity — keep minimal safe implementations
	renderContentLibrary() { const container = document.getElementById('social-content-library'); if (!container) return; const library = this.getContentLibrary(); container.innerHTML = library.map((content: any) => `<div class="content-item">${content.title}</div>`).join(''); }
	renderScheduledPosts() { const container = document.getElementById('scheduled-posts'); if (!container) return; const posts = this.getScheduledPosts(); container.innerHTML = posts.map((p: any) => `<div>${p.caption || ''}</div>`).join(''); }
	renderSocialComments() { const container = document.getElementById('social-comments'); if (!container) return; const comments = this.getSocialComments(); container.innerHTML = comments.slice(0,10).map((c: any) => `<div>${c.text}</div>`).join(''); }

	setupEventListeners() { document.getElementById('add-content-btn')?.addEventListener('click', () => this.openAddContentModal()); document.getElementById('add-event-btn')?.addEventListener('click', () => this.openAddEventModal()); document.getElementById('simulate-comment-btn')?.addEventListener('click', () => this.simulateIncomingComment()); }

	setupScheduler() { setInterval(() => this.checkScheduledPosts(), 60000); }
	checkScheduledPosts() { const posts = this.getScheduledPosts(); const now = new Date(); posts.forEach((post: any) => { if (post.status === 'scheduled' && new Date(post.scheduledTime) <= now) this.executePost(post); }); }
	async executePost(post: any) { post.status = 'posted'; post.postedTime = new Date().toISOString(); const posts = this.getScheduledPosts(); const index = posts.findIndex((p: any) => p.id === post.id); if (index >= 0) { posts[index] = post; this.saveScheduledPosts(posts); } this.renderScheduledPosts(); }

	simulateIncomingComment() { const sampleComments = [{ text: "Love your food! When are you open today?", author: 'foodie_jane', platform: 'instagram' }]; this.handleIncomingComment(sampleComments[0]); (window as any).UIManager?.showNotification('New comment received!', 'info'); }

	openAddContentModal() { (window as any).UIManager?.showNotification('Content upload modal - feature coming soon!', 'info'); }
	openAddEventModal() { (window as any).UIManager?.showNotification('Event creation modal - feature coming soon!', 'info'); }

	// Utilities
	generateId(prefix = '') { return prefix + Math.random().toString(36).slice(2,9); }
	friendlyDate(iso: any) { if (!iso) return '—'; try { return new Date(iso).toLocaleString(); } catch { return iso; } }

	lsRead(key: string, defaultValue: any = null) { try { const v = localStorage.getItem(key); if (v === null || v === undefined) return defaultValue; return JSON.parse(v); } catch (e) { console.warn(`Error reading localStorage key "${key}":`, e); return defaultValue; } }
	lsWrite(key: string, value: any) { try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch (e) { console.error(`Error writing to localStorage key "${key}":`, e); return false; } }
}

document.addEventListener('DOMContentLoaded', () => { if (!(window as any).socialMediaManager) (window as any).socialMediaManager = new SocialMediaManager(); });

export {};

