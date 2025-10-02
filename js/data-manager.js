/**
 * Data Management and Backup System
 * Handles booking data persistence, export, and backup functionality
 */

class DataManager {
    constructor() {
        this.storageKey = 'restaurant-bookings';
        this.configKey = 'restaurant-config';
        this.backupKey = 'restaurant-data-backup';
        this.maxBackups = 5;
        this.init();
    }

    init() {
        this.setupAutoBackup();
        this.migrateOldData();
        this.setupExportButtons();
    }

    // Booking Management
    saveBooking(booking) {
        try {
            // Validate booking data
            const validatedBooking = this.validateBooking(booking);
            if (!validatedBooking.isValid) {
                throw new Error('Invalid booking data: ' + validatedBooking.errors.join(', '));
            }

            // Add metadata
            const bookingData = {
                ...booking,
                id: booking.id || window.SecurityManager?.generateSecureId() || this.generateId(),
                timestamp: new Date().toISOString(),
                version: '1.0'
            };

            // Get existing bookings
            const bookings = this.getAllBookings();
            
            // Check for duplicates
            const duplicate = bookings.find(b => 
                b.customerName === bookingData.customerName &&
                b.date === bookingData.date &&
                b.time === bookingData.time
            );

            if (duplicate) {
                throw new Error('Duplicate booking detected');
            }

            // Add new booking
            bookings.push(bookingData);

            // Save to storage
            const saved = window.BrowserCompatibility?.safeStorage.set(this.storageKey, bookings);
            if (!saved) {
                throw new Error('Failed to save to storage');
            }

            // Create backup
            this.createBackup();

            // Send analytics
            this.trackBookingCreated(bookingData);

            return bookingData;
        } catch (error) {
            window.ProductionErrorHandler?.handleError('Storage Error', error);
            throw error;
        }
    }

    getAllBookings() {
        return window.BrowserCompatibility?.safeStorage.get(this.storageKey, []) || [];
    }

    getBookingById(id) {
        const bookings = this.getAllBookings();
        return bookings.find(b => b.id === id);
    }

    updateBooking(id, updates) {
        try {
            const bookings = this.getAllBookings();
            const index = bookings.findIndex(b => b.id === id);
            
            if (index === -1) {
                throw new Error('Booking not found');
            }

            // Merge updates
            bookings[index] = {
                ...bookings[index],
                ...updates,
                updatedAt: new Date().toISOString()
            };

            // Validate updated booking
            const validation = this.validateBooking(bookings[index]);
            if (!validation.isValid) {
                throw new Error('Invalid booking update: ' + validation.errors.join(', '));
            }

            // Save
            window.BrowserCompatibility?.safeStorage.set(this.storageKey, bookings);
            this.createBackup();

            return bookings[index];
        } catch (error) {
            window.ProductionErrorHandler?.handleError('Storage Error', error);
            throw error;
        }
    }

    deleteBooking(id) {
        try {
            const bookings = this.getAllBookings();
            const filteredBookings = bookings.filter(b => b.id !== id);
            
            if (filteredBookings.length === bookings.length) {
                throw new Error('Booking not found');
            }

            window.BrowserCompatibility?.safeStorage.set(this.storageKey, filteredBookings);
            this.createBackup();

            return true;
        } catch (error) {
            window.ProductionErrorHandler?.handleError('Storage Error', error);
            throw error;
        }
    }

    // Validation
    validateBooking(booking) {
        const errors = [];

        // Required fields
        if (!booking.customerName || booking.customerName.trim().length < 1) {
            errors.push('Customer name is required');
        }

        if (!booking.date) {
            errors.push('Date is required');
        } else if (!window.InputValidator?.date(booking.date)) {
            errors.push('Invalid date');
        }

        if (!booking.time) {
            errors.push('Time is required');
        } else if (!window.InputValidator?.time(booking.time)) {
            errors.push('Invalid time');
        }

        if (!booking.partySize || !window.InputValidator?.partySize(booking.partySize)) {
            errors.push('Valid party size is required (1-50)');
        }

        if (booking.phone && !window.InputValidator?.phone(booking.phone)) {
            errors.push('Invalid phone number format');
        }

        if (booking.email && !window.InputValidator?.email(booking.email)) {
            errors.push('Invalid email format');
        }

        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }

    // Backup System
    setupAutoBackup() {
        // Create backup every 10 bookings or daily
        setInterval(() => {
            this.createBackup();
        }, 24 * 60 * 60 * 1000); // Daily

        // Backup on page unload
        window.addEventListener('beforeunload', () => {
            this.createBackup();
        });
    }

    createBackup() {
        try {
            const backupData = {
                bookings: this.getAllBookings(),
                config: window.BrowserCompatibility?.safeStorage.get(this.configKey, null),
                timestamp: new Date().toISOString(),
                version: '1.0'
            };

            // Get existing backups
            const backups = window.BrowserCompatibility?.safeStorage.get(this.backupKey, []) || [];
            
            // Add new backup
            backups.push(backupData);

            // Keep only last N backups
            if (backups.length > this.maxBackups) {
                backups.splice(0, backups.length - this.maxBackups);
            }

            // Save backups
            window.BrowserCompatibility?.safeStorage.set(this.backupKey, backups);
        } catch (error) {
            console.warn('Failed to create backup:', error);
        }
    }

    restoreFromBackup(backupIndex = 0) {
        try {
            const backups = window.BrowserCompatibility?.safeStorage.get(this.backupKey, []);
            
            if (!backups || backups.length === 0) {
                throw new Error('No backups available');
            }

            const backup = backups[backups.length - 1 - backupIndex]; // Latest first
            
            if (!backup) {
                throw new Error('Backup not found');
            }

            // Restore bookings
            if (backup.bookings) {
                window.BrowserCompatibility?.safeStorage.set(this.storageKey, backup.bookings);
            }

            // Restore config
            if (backup.config) {
                window.BrowserCompatibility?.safeStorage.set(this.configKey, backup.config);
            }

            window.ProductionErrorHandler?.showNotification(
                `Restored from backup (${new Date(backup.timestamp).toLocaleString()})`, 
                'info'
            );

            return backup;
        } catch (error) {
            window.ProductionErrorHandler?.handleError('Storage Error', error);
            throw error;
        }
    }

    // Export Functions
    exportBookings(format = 'json') {
        const bookings = this.getAllBookings();
        
        switch (format.toLowerCase()) {
            case 'json':
                return this.exportAsJSON(bookings);
            case 'csv':
                return this.exportAsCSV(bookings);
            case 'excel':
                return this.exportAsExcel(bookings);
            default:
                throw new Error('Unsupported export format');
        }
    }

    exportAsJSON(bookings) {
        const data = {
            bookings: bookings,
            exportDate: new Date().toISOString(),
            totalCount: bookings.length,
            version: '1.0'
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        this.downloadBlob(blob, `bookings-${this.getDateString()}.json`);
    }

    exportAsCSV(bookings) {
        const headers = ['ID', 'Customer Name', 'Date', 'Time', 'Party Size', 'Phone', 'Email', 'Special Requests', 'Status', 'Created'];
        
        const csvContent = [
            headers.join(','),
            ...bookings.map(booking => [
                booking.id || '',
                this.escapeCsvField(booking.customerName || ''),
                booking.date || '',
                booking.time || '',
                booking.partySize || '',
                booking.phone || '',
                booking.email || '',
                this.escapeCsvField(booking.specialRequests || ''),
                booking.status || 'confirmed',
                booking.timestamp || ''
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        this.downloadBlob(blob, `bookings-${this.getDateString()}.csv`);
    }

    exportAsExcel(bookings) {
        // Simple tab-separated format that Excel can open
        const headers = ['ID', 'Customer Name', 'Date', 'Time', 'Party Size', 'Phone', 'Email', 'Special Requests', 'Status', 'Created'];
        
        const tsvContent = [
            headers.join('\t'),
            ...bookings.map(booking => [
                booking.id || '',
                booking.customerName || '',
                booking.date || '',
                booking.time || '',
                booking.partySize || '',
                booking.phone || '',
                booking.email || '',
                booking.specialRequests || '',
                booking.status || 'confirmed',
                booking.timestamp || ''
            ].join('\t'))
        ].join('\n');

        const blob = new Blob([tsvContent], { type: 'application/vnd.ms-excel' });
        this.downloadBlob(blob, `bookings-${this.getDateString()}.xls`);
    }

    // Utility Functions
    downloadBlob(blob, filename) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    escapeCsvField(field) {
        if (typeof field !== 'string') return '';
        if (field.includes(',') || field.includes('"') || field.includes('\n')) {
            return '"' + field.replace(/"/g, '""') + '"';
        }
        return field;
    }

    getDateString() {
        return new Date().toISOString().split('T')[0];
    }

    generateId() {
        return 'booking_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    // Migration for old data formats
    migrateOldData() {
        try {
            // Check if there's old data in different format
            const oldBookings = localStorage.getItem('bookings');
            if (oldBookings && !localStorage.getItem(this.storageKey)) {
                const parsed = JSON.parse(oldBookings);
                if (Array.isArray(parsed)) {
                    // Migrate old format to new format
                    const migratedBookings = parsed.map(booking => ({
                        ...booking,
                        id: booking.id || this.generateId(),
                        timestamp: booking.timestamp || new Date().toISOString(),
                        version: '1.0'
                    }));
                    
                    window.BrowserCompatibility?.safeStorage.set(this.storageKey, migratedBookings);
                    this.createBackup();
                    
                    console.info('Migrated', migratedBookings.length, 'bookings to new format');
                }
            }
        } catch (error) {
            console.warn('Failed to migrate old data:', error);
        }
    }

    // UI Integration
    setupExportButtons() {
        // Add export buttons to UI if not present
        document.addEventListener('DOMContentLoaded', () => {
            this.addExportButtons();
        });
    }

    addExportButtons() {
        const container = document.querySelector('.management-section') || document.querySelector('.container');
        if (!container || document.getElementById('export-buttons')) return;

        const exportDiv = document.createElement('div');
        exportDiv.id = 'export-buttons';
        exportDiv.className = 'mt-4 flex flex-wrap gap-2';
        exportDiv.innerHTML = `
            <button onclick="window.DataManager.exportBookings('json')" 
                    class="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm">
                Export JSON
            </button>
            <button onclick="window.DataManager.exportBookings('csv')" 
                    class="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-sm">
                Export CSV
            </button>
            <button onclick="window.DataManager.exportBookings('excel')" 
                    class="px-3 py-1 bg-orange-500 text-white rounded hover:bg-orange-600 text-sm">
                Export Excel
            </button>
            <button onclick="window.DataManager.createBackup(); alert('Backup created!')" 
                    class="px-3 py-1 bg-purple-500 text-white rounded hover:bg-purple-600 text-sm">
                Create Backup
            </button>
        `;

        container.appendChild(exportDiv);
    }

    // Analytics
    trackBookingCreated(booking) {
        if (window.AnalyticsManager) {
            window.AnalyticsManager.trackEvent('booking_created', {
                party_size: booking.partySize,
                has_special_requests: !!(booking.specialRequests && booking.specialRequests.trim()),
                category: 'Bookings'
            });
        }
    }

    // Statistics
    getBookingStats() {
        const bookings = this.getAllBookings();
        const now = new Date();
        const today = now.toISOString().split('T')[0];
        const thisMonth = now.toISOString().substring(0, 7);

        return {
            total: bookings.length,
            today: bookings.filter(b => b.date === today).length,
            thisMonth: bookings.filter(b => b.date && b.date.startsWith(thisMonth)).length,
            averagePartySize: bookings.reduce((sum, b) => sum + (parseInt(b.partySize) || 0), 0) / (bookings.length || 1),
            withSpecialRequests: bookings.filter(b => b.specialRequests && b.specialRequests.trim()).length,
            withPhoneNumbers: bookings.filter(b => b.phone && b.phone.trim()).length,
            withEmails: bookings.filter(b => b.email && b.email.trim()).length
        };
    }
}

// Create global data manager
window.DataManager = new DataManager();

// Expose debugging methods
if (window.ProductionErrorHandler && window.ProductionErrorHandler.isDevelopment()) {
    window.debugData = {
        stats: () => window.DataManager.getBookingStats(),
        export: (format) => window.DataManager.exportBookings(format),
        backup: () => window.DataManager.createBackup(),
        restore: (index) => window.DataManager.restoreFromBackup(index),
        bookings: () => window.DataManager.getAllBookings()
    };
}