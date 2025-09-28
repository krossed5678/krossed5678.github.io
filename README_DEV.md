# Development Guide

This is a fully client-side web application - no server or build process required!

## Architecture

### Client-Side Only Design
- **No backend required**: Everything runs in the browser
- **No build process**: Open `index.html` directly
- **No dependencies**: Pure HTML/CSS/JavaScript
- **localStorage persistence**: Data saved in browser

### File Structure
```
index.html          # Main application interface  
app.js              # All application logic
style.css           # Styling and animations
README.md           # User documentation
.gitignore          # Git ignore rules
```

## Development Workflow

1. **Edit files directly** - no compilation needed
2. **Refresh browser** to see changes
3. **Use browser dev tools** for debugging
4. **Test voice features** in Chrome/Edge

## Key Technologies

### Web APIs Used
- **SpeechRecognition**: Voice input parsing
- **SpeechSynthesis**: Text-to-speech output  
- **localStorage**: Data persistence

### JavaScript Features
- ES6+ async/await
- Modular functions
- Event-driven architecture
- Responsive design patterns

## Customization

### Adding New Review Templates
Edit `simulateFetchReviews()` in `app.js`:
```javascript
const positiveReviews = [
  'Your new positive review template here',
  // ... existing reviews
];
```

### Modifying Voice Commands
Update `parseBookingCommand()` in `app.js` to handle new phrases:
```javascript
// Add new time parsing patterns
if (/your-new-pattern/.test(text)) {
  // handle new pattern
}
```

### Styling Changes
Edit `style.css` directly - changes appear immediately on refresh.

## Browser Testing

### Recommended Testing Browsers
- **Chrome**: Full voice support
- **Edge**: Full voice support  
- **Firefox**: Limited voice support
- **Safari**: Limited voice support

### Mobile Testing
- Open on mobile browser
- Hamburger menu should work properly
- Voice may not work on iOS Safari

## Data Structure

### Bookings (localStorage)
```javascript
{
  id: number,
  customer_name: string,
  start_time: ISO_string,
  end_time: ISO_string,  
  party_size: number,
  notes: string,
  status: 'pending'|'confirmed'|'cancelled'
}
```

### Reviews (simulated)
```javascript
{
  id: string,
  author_name: string,
  rating: 1-5,
  text: string,
  time: ISO_string
}
```

## Deployment

Since this is client-side only:
- **GitHub Pages**: Just push to gh-pages branch
- **Netlify**: Drag and drop folder
- **Any web server**: Upload files to public directory
- **Local sharing**: Email/USB the files

No server configuration needed!
