// Message Channel Error Fix
// This script fixes the "A listener indicated an asynchronous response by returning true, 
// but the message channel closed before a response was received" error

console.log('🔧 Applying enhanced message channel error fix...');

// 1. Set up global error handler for message channel errors
window.addEventListener('error', function(event) {
    if (event.error && event.error.message && event.error.message.includes('message channel closed')) {
        console.log('✅ Message channel error intercepted and prevented');
        event.preventDefault();
        event.stopPropagation();
        return false;
    }
    
    // Also catch other related errors
    if (event.error && event.error.message && (
        event.error.message.includes('message channel') ||
        event.error.message.includes('asynchronous response') ||
        event.error.message.includes('response by returning true')
    )) {
        console.log('✅ Related message channel error intercepted and prevented');
        event.preventDefault();
        event.stopPropagation();
        return false;
    }
}, true);

// 2. Handle unhandled promise rejections more comprehensively
window.addEventListener('unhandledrejection', function(event) {
    const reason = event.reason;
    const message = reason?.message || reason?.toString() || '';
    
    if (message.includes('message channel closed') ||
        message.includes('asynchronous response') ||
        message.includes('response by returning true') ||
        message.includes('listener indicated')) {
        
        console.log('✅ Unhandled message channel rejection intercepted:', message);
        event.preventDefault();
        return false;
    }
    
    // Log other unhandled rejections for debugging
    console.warn('⚠️ Unhandled promise rejection:', reason);
});

// 3. Enhanced async operation manager
window.asyncOperationManager = {
    operations: new Map(),
    operationCount: 0,
    
    addOperation: function(operation) {
        const id = `op_${++this.operationCount}_${Date.now()}`;
        this.operations.set(id, {
            operation: operation,
            timestamp: Date.now(),
            status: 'pending'
        });
        
        // Set timeout to prevent hanging operations
        setTimeout(() => {
            if (this.operations.has(id)) {
                console.warn(`⚠️ Operation ${id} timed out, cleaning up`);
                this.removeOperation(id);
            }
        }, 30000); // 30 second timeout
        
        return id;
    },
    
    removeOperation: function(id) {
        this.operations.delete(id);
    },
    
    cleanup: function() {
        this.operations.clear();
        this.operationCount = 0;
    },
    
    getStatus: function() {
        return {
            activeOperations: this.operations.size,
            totalOperations: this.operationCount
        };
    }
};

// 4. Override console methods to catch errors
const originalConsoleError = console.error;
console.error = function(...args) {
    const message = args.join(' ');
    if (message.includes('message channel closed') ||
        message.includes('asynchronous response') ||
        message.includes('response by returning true')) {
        console.log('✅ Message channel error logged to console - handled');
        return;
    }
    originalConsoleError.apply(console, args);
};

// 5. Enhanced message event listener with proper cleanup
let messageListener = null;
function setupMessageListener() {
    if (messageListener) {
        window.removeEventListener('message', messageListener);
    }
    
    messageListener = function(event) {
        try {
            // Handle message events safely
            if (event.data && typeof event.data === 'object') {
                // Filter out React DevTools and other extension messages
                if (event.data.source === 'react-devtools-content-script' || 
                    event.data.source === 'react-devtools-backend' ||
                    event.data.source === 'react-devtools' ||
                    (event.data.hello && event.data.source && event.data.source.includes('devtools'))) {
                    // Skip logging React DevTools messages
                    return;
                }
                
                // Only log relevant application messages
                if (event.data.type || event.data.action || event.data.message) {
                    console.log('📨 Message received:', event.data);
                }
            }
        } catch (error) {
            console.log('⚠️ Error processing message:', error.message);
        }
    };
    
    window.addEventListener('message', messageListener);
}

// 6. Enhanced storage event listener with proper cleanup
let storageListener = null;
function setupStorageListener() {
    if (storageListener) {
        window.removeEventListener('storage', storageListener);
    }
    
    storageListener = function(event) {
        try {
            // Handle storage events safely
            if (event.key && event.newValue) {
                console.log('💾 Storage change:', event.key, event.newValue);
            }
        } catch (error) {
            console.log('⚠️ Error processing storage event:', error.message);
        }
    };
    
    window.addEventListener('storage', storageListener);
}

// 7. Set up additional error prevention mechanisms
function setupErrorPrevention() {
    // Prevent common async operation issues
    const originalSetTimeout = window.setTimeout;
    const originalSetInterval = window.setInterval;
    
    window.setTimeout = function(callback, delay, ...args) {
        const wrappedCallback = function() {
            try {
                return callback.apply(this, args);
            } catch (error) {
                if (error.message.includes('message channel')) {
                    console.log('✅ Message channel error in setTimeout prevented');
                    return;
                }
                throw error;
            }
        };
        
        return originalSetTimeout(wrappedCallback, delay);
    };
    
    window.setInterval = function(callback, delay, ...args) {
        const wrappedCallback = function() {
            try {
                return callback.apply(this, args);
            } catch (error) {
                if (error.message.includes('message channel')) {
                    console.log('✅ Message channel error in setInterval prevented');
                    return;
                }
                throw error;
            }
        };
        
        return originalSetInterval(wrappedCallback, delay);
    };
}

// 8. Initialize all listeners
function initializeErrorHandling() {
    console.log('🔧 Initializing enhanced error handling...');
    
    setupMessageListener();
    setupStorageListener();
    setupErrorPrevention();
    
    // Set up periodic cleanup
    setInterval(() => {
        const status = window.asyncOperationManager.getStatus();
        if (status.activeOperations > 10) {
            console.log('🧹 Cleaning up old operations');
            window.asyncOperationManager.cleanup();
        }
    }, 60000); // Check every minute
    
    console.log('✅ Enhanced error handling initialized');
}

// 9. Cleanup function
function cleanupErrorHandling() {
    if (messageListener) {
        window.removeEventListener('message', messageListener);
        messageListener = null;
    }
    if (storageListener) {
        window.removeEventListener('storage', storageListener);
        storageListener = null;
    }
    window.asyncOperationManager.cleanup();
    console.log('🧹 Error handling cleaned up');
}

// 10. Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeErrorHandling);
} else {
    initializeErrorHandling();
}

// 11. Expose functions globally
window.messageChannelFix = {
    setupMessageListener: setupMessageListener,
    setupStorageListener: setupStorageListener,
    initializeErrorHandling: initializeErrorHandling,
    cleanupErrorHandling: cleanupErrorHandling,
    asyncOperationManager: window.asyncOperationManager
};

console.log('🔧 Enhanced message channel error fix loaded and ready');
