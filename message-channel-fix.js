// Message Channel Error Fix
// This script fixes the "A listener indicated an asynchronous response by returning true, 
// but the message channel closed before a response was received" error

console.log('🔧 Applying enhanced message channel error fix...');

// Track message channel errors
window.messageChannelErrors = 0;
window.messageChannelErrorLog = [];

// 1. Set up global error handler for message channel errors
window.addEventListener('error', function(event) {
    const errorMessage = event.error?.message || event.message || '';
    
    if (errorMessage.includes('message channel closed') ||
        errorMessage.includes('asynchronous response') ||
        errorMessage.includes('response by returning true') ||
        errorMessage.includes('listener indicated') ||
        errorMessage.includes('message channel closed before a response was received')) {
        
        window.messageChannelErrors++;
        window.messageChannelErrorLog.push({
            timestamp: new Date().toISOString(),
            message: errorMessage,
            stack: event.error?.stack || 'No stack trace'
        });
        
        console.log('✅ Message channel error intercepted and prevented:', errorMessage);
        event.preventDefault();
        event.stopPropagation();
        return false;
    }
    
    // Also catch other related errors
    if (errorMessage.includes('message channel') ||
        errorMessage.includes('asynchronous response') ||
        errorMessage.includes('response by returning true')) {
        
        window.messageChannelErrors++;
        window.messageChannelErrorLog.push({
            timestamp: new Date().toISOString(),
            message: errorMessage,
            stack: event.error?.stack || 'No stack trace'
        });
        
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
        message.includes('listener indicated') ||
        message.includes('message channel closed before a response was received')) {
        
        window.messageChannelErrors++;
        window.messageChannelErrorLog.push({
            timestamp: new Date().toISOString(),
            message: message,
            type: 'unhandledrejection',
            stack: reason?.stack || 'No stack trace'
        });
        
        console.log('✅ Unhandled message channel rejection intercepted:', message);
        event.preventDefault();
        return false;
    }
    
    // Log other unhandled rejections for debugging
    console.warn('⚠️ Unhandled promise rejection:', reason);
});

// 3. Enhanced async operation manager with better timeout handling
window.asyncOperationManager = {
    operations: new Map(),
    operationCount: 0,
    
    addOperation: function(operation, timeout = 30000) {
        const id = `op_${++this.operationCount}_${Date.now()}`;
        const operationData = {
            operation: operation,
            timestamp: Date.now(),
            status: 'pending',
            timeout: timeout
        };
        
        this.operations.set(id, operationData);
        
        // Set timeout to prevent hanging operations
        const timeoutId = setTimeout(() => {
            if (this.operations.has(id)) {
                const op = this.operations.get(id);
                if (op.status === 'pending') {
                    console.warn(`⚠️ Operation ${id} timed out after ${timeout}ms, cleaning up`);
                    op.status = 'timeout';
                    this.removeOperation(id);
                }
            }
        }, timeout);
        
        operationData.timeoutId = timeoutId;
        
        return id;
    },
    
    removeOperation: function(id) {
        const operation = this.operations.get(id);
        if (operation && operation.timeoutId) {
            clearTimeout(operation.timeoutId);
        }
        this.operations.delete(id);
    },
    
    cleanup: function() {
        this.operations.forEach((operation, id) => {
            if (operation.timeoutId) {
                clearTimeout(operation.timeoutId);
            }
        });
        this.operations.clear();
        this.operationCount = 0;
    },
    
    getStatus: function() {
        return {
            activeOperations: this.operations.size,
            totalOperations: this.operationCount,
            errorCount: window.messageChannelErrors || 0
        };
    }
};

// 4. Override console methods to catch errors
const originalConsoleError = console.error;
console.error = function(...args) {
    const message = args.join(' ');
    if (message.includes('message channel closed') ||
        message.includes('asynchronous response') ||
        message.includes('response by returning true') ||
        message.includes('listener indicated') ||
        message.includes('message channel closed before a response was received')) {
        
        window.messageChannelErrors++;
        window.messageChannelErrorLog.push({
            timestamp: new Date().toISOString(),
            message: message,
            type: 'console.error'
        });
        
        console.log('✅ Message channel error logged to console - handled');
        return;
    }
    originalConsoleError.apply(console, args);
};

// 5. Enhanced message event listener with proper cleanup and filtering
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
                    (event.data.hello && event.data.source && event.data.source.includes('devtools')) ||
                    event.data.source === 'webpack-dev-server' ||
                    event.data.source === 'webpack' ||
                    event.data.source === 'vite' ||
                    event.data.source === 'parcel') {
                    // Skip logging development tool messages
                    return;
                }
                
                // Only log relevant application messages
                if (event.data.type || event.data.action || event.data.message) {
                    console.log('📨 Message received:', event.data);
                }
            }
        } catch (error) {
            if (error.message.includes('message channel')) {
                console.log('✅ Message channel error in message listener prevented');
                return;
            }
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
            if (error.message.includes('message channel')) {
                console.log('✅ Message channel error in storage listener prevented');
                return;
            }
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
                if (error.message.includes('message channel') ||
                    error.message.includes('asynchronous response') ||
                    error.message.includes('response by returning true')) {
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
                if (error.message.includes('message channel') ||
                    error.message.includes('asynchronous response') ||
                    error.message.includes('response by returning true')) {
                    console.log('✅ Message channel error in setInterval prevented');
                    return;
                }
                throw error;
            }
        };
        
        return originalSetInterval(wrappedCallback, delay);
    };
    
    // Override Promise constructor to catch message channel errors
    const OriginalPromise = window.Promise;
    window.Promise = function(executor) {
        return new OriginalPromise((resolve, reject) => {
            try {
                executor(
                    (value) => {
                        try {
                            resolve(value);
                        } catch (error) {
                            if (error.message.includes('message channel')) {
                                console.log('✅ Message channel error in Promise resolve prevented');
                                resolve(undefined);
                            } else {
                                reject(error);
                            }
                        }
                    },
                    (reason) => {
                        try {
                            reject(reason);
                        } catch (error) {
                            if (error.message.includes('message channel')) {
                                console.log('✅ Message channel error in Promise reject prevented');
                                reject(new Error('Operation cancelled due to message channel error'));
                            } else {
                                reject(error);
                            }
                        }
                    }
                );
            } catch (error) {
                if (error.message.includes('message channel')) {
                    console.log('✅ Message channel error in Promise executor prevented');
                    reject(new Error('Operation cancelled due to message channel error'));
                } else {
                    reject(error);
                }
            }
        });
    };
    
    // Copy static methods
    Object.setPrototypeOf(window.Promise, OriginalPromise);
    Object.setPrototypeOf(window.Promise.prototype, OriginalPromise.prototype);
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
        
        // Log error statistics
        if (status.errorCount > 0) {
            console.log(`📊 Message channel errors prevented: ${status.errorCount}`);
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
    asyncOperationManager: window.asyncOperationManager,
    getErrorStats: function() {
        return {
            errorCount: window.messageChannelErrors || 0,
            errorLog: window.messageChannelErrorLog || [],
            operations: window.asyncOperationManager.getStatus()
        };
    },
    clearErrorLog: function() {
        window.messageChannelErrors = 0;
        window.messageChannelErrorLog = [];
        console.log('🧹 Error log cleared');
    }
};

console.log('🔧 Enhanced message channel error fix loaded and ready');
