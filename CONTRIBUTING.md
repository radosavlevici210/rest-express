
# Contributing to REST Express API

Thank you for your interest in contributing! This document provides guidelines for contributing to this production-ready REST API.

## 🚀 Getting Started

1. **Fork the Repository**
   ```bash
   git clone https://github.com/radosavlevici210/rest-express-api-production.git
   cd rest-express-api-production
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Run in Development Mode**
   ```bash
   npm run dev
   ```

4. **Run Tests**
   ```bash
   npm test
   ```

## 📋 Development Guidelines

### Code Standards
- Follow existing code patterns and structure
- Maintain comprehensive error handling
- Add appropriate validation for new endpoints
- Include monitoring and logging for new features

### Testing Requirements
- All new endpoints must include tests
- Test both success and error scenarios
- Verify security features (rate limiting, validation)
- Test production environment configurations

### Security Considerations
- Never commit sensitive data or API keys
- Maintain rate limiting on all endpoints
- Follow input validation patterns
- Preserve security headers configuration

## 🔧 Pull Request Process

1. **Create a Feature Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make Your Changes**
   - Follow existing code patterns
   - Add tests for new functionality
   - Update documentation if needed

3. **Test Your Changes**
   ```bash
   npm test
   npm run prod  # Test production mode
   ```

4. **Submit Pull Request**
   - Provide clear description of changes
   - Reference any related issues
   - Ensure all tests pass

## 📊 Production Features to Maintain

When contributing, ensure these production features remain intact:

### Security Features
- ✅ Helmet.js security headers
- ✅ Rate limiting (100 req/15min)
- ✅ CORS protection
- ✅ Input validation
- ✅ Error handling

### Monitoring Features
- ✅ Health check endpoint (`/health`)
- ✅ Performance monitoring (`/api/monitor`)
- ✅ API statistics (`/api/stats`)
- ✅ Memory tracking

### Performance Features
- ✅ Response compression
- ✅ Efficient pagination
- ✅ Optimized static serving
- ✅ Graceful shutdown

## 🐛 Bug Reports

When reporting bugs:
- Use the GitHub issue template
- Include steps to reproduce
- Provide error logs (without sensitive data)
- Specify environment details

## 💡 Feature Requests

For new features:
- Describe the use case
- Consider security implications
- Maintain production-ready standards
- Include monitoring considerations

## 📖 Documentation

- Update README.md for significant changes
- Maintain API documentation accuracy
- Update deployment guides if needed
- Keep examples current

---

**Thank you for contributing to this production-ready API!** 🙏
