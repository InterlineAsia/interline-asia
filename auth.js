// Interline Asia - Authentication & User Management
// Simple client-side authentication system

class AuthSystem {
  constructor() {
    this.users = this.loadUsers();
    this.currentUser = this.getCurrentUser();
  }

  // Load users from localStorage (simulating backend)
  loadUsers() {
    const stored = localStorage.getItem('interlineUsers');
    return stored ? JSON.parse(stored) : [];
  }

  // Save users to localStorage
  saveUsers() {
    localStorage.setItem('interlineUsers', JSON.stringify(this.users));
  }

  // Get current logged-in user
  getCurrentUser() {
    const stored = localStorage.getItem('currentUser');
    return stored ? JSON.parse(stored) : null;
  }

  // Set current user
  setCurrentUser(user) {
    localStorage.setItem('currentUser', JSON.stringify(user));
    this.currentUser = user;
  }

  // Clear current user (logout)
  logout() {
    localStorage.removeItem('currentUser');
    this.currentUser = null;
    window.location.href = 'login.html';
  }

  // Register new user
  register(userData) {
    // Check if email already exists
    if (this.users.find(user => user.email === userData.email)) {
      throw new Error('Email already registered');
    }

    // Create new user
    const newUser = {
      id: Date.now().toString(),
      fullName: userData.fullName,
      email: userData.email,
      password: userData.password, // In real app, this would be hashed
      registeredAt: new Date().toISOString(),
      verificationStatus: 'pending',
      uploads: []
    };

    this.users.push(newUser);
    this.saveUsers();
    
    // Simulate admin notification
    this.notifyAdmin('registration', newUser);
    
    return newUser;
  }

  // Login user
  login(email, password) {
    const user = this.users.find(u => u.email === email && u.password === password);
    if (!user) {
      throw new Error('Invalid email or password');
    }
    
    this.setCurrentUser(user);
    return user;
  }

  // Add upload to user
  addUpload(uploadData) {
    if (!this.currentUser) {
      throw new Error('User not logged in');
    }

    const upload = {
      id: Date.now().toString(),
      fileName: uploadData.fileName,
      fileType: uploadData.fileType,
      uploadedAt: new Date().toISOString(),
      status: 'pending'
    };

    // Find user and add upload
    const userIndex = this.users.findIndex(u => u.id === this.currentUser.id);
    if (userIndex !== -1) {
      this.users[userIndex].uploads.push(upload);
      this.saveUsers();
      
      // Update current user
      this.currentUser = this.users[userIndex];
      this.setCurrentUser(this.currentUser);
      
      // Notify admin
      this.notifyAdmin('upload', this.currentUser, upload);
    }

    return upload;
  }

  // Simulate admin notification
  notifyAdmin(type, user, upload = null) {
    let subject, body;
    
    if (type === 'registration') {
      subject = `New User Registration - ${user.fullName}`;
      body = `New user registered:\n\nName: ${user.fullName}\nEmail: ${user.email}\nRegistered: ${new Date(user.registeredAt).toLocaleString()}`;
    } else if (type === 'upload') {
      subject = `New Document Upload - ${user.fullName}`;
      body = `User uploaded document:\n\nName: ${user.fullName}\nEmail: ${user.email}\nFile: ${upload.fileName}\nUploaded: ${new Date(upload.uploadedAt).toLocaleString()}`;
    }

    // Create mailto link (in real app, this would be an API call)
    const mailtoLink = `mailto:admin@interlineasia.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    
    // Log for development
    console.log('Admin Notification:', { type, subject, body, mailtoLink });
    
    // In a real app, you'd send this to your backend
    // For now, we'll just log it
  }

  // Check if user is logged in
  isLoggedIn() {
    return this.currentUser !== null;
  }

  // Require authentication (redirect if not logged in)
  requireAuth() {
    if (!this.isLoggedIn()) {
      window.location.href = 'login.html';
      return false;
    }
    return true;
  }
}

// Create global auth instance
window.auth = new AuthSystem();

// Utility functions
function showError(message, elementId = 'error-message') {
  const errorEl = document.getElementById(elementId);
  if (errorEl) {
    errorEl.textContent = message;
    errorEl.style.display = 'block';
  }
}

function hideError(elementId = 'error-message') {
  const errorEl = document.getElementById(elementId);
  if (errorEl) {
    errorEl.style.display = 'none';
  }
}

function showSuccess(message, elementId = 'success-message') {
  const successEl = document.getElementById(elementId);
  if (successEl) {
    successEl.textContent = message;
    successEl.style.display = 'block';
  }
}