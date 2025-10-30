# AutoLeads Super Admin Frontend

A comprehensive Super Admin dashboard for managing multi-tenant AutoLeads platform. Built with React, TypeScript, and Tailwind CSS following modern development practices.

## 🚀 Features

### Authentication & Security
- ✅ JWT-based authentication with refresh tokens
- ✅ Secure session management
- ✅ Role-based access control
- ✅ Route protection and guards
- ✅ Auto token refresh
- ✅ Secure logout functionality

### Dashboard & Analytics
- ✅ Global overview with real-time metrics
- ✅ Interactive charts using Recharts
- ✅ Tenant performance analytics
- ✅ Revenue tracking and trends
- ✅ Growth metrics and KPIs
- ✅ Customizable date ranges
- ✅ Data export functionality

### Tenant Management
- ✅ Complete CRUD operations
- ✅ Advanced search and filtering
- ✅ Bulk actions support
- ✅ Tenant health scoring
- ✅ Theme customization
- ✅ Status management (active/suspended)
- ✅ Plan management

### Theme Management
- ✅ Visual theme editor
- ✅ Color picker with live preview
- ✅ Logo upload and management
- ✅ Preset themes
- ✅ Real-time preview
- ✅ Brand customization

### System Monitoring
- ✅ Real-time health monitoring
- ✅ Service status tracking
- ✅ Performance metrics
- ✅ WhatsApp bot analytics
- ✅ Storage usage monitoring
- ✅ Error logging and tracking
- ✅ Auto-refresh capabilities

### Settings Management
- ✅ General system settings
- ✅ Security configurations
- ✅ WhatsApp integration settings
- ✅ Notification preferences
- ✅ Feature flags management
- ✅ Import/Export functionality

## 🎨 Design System

### Color Palette (Dark Theme)
- **Primary**: #1e40af (Deep Blue)
- **Secondary**: #1f2937 (Dark Gray)
- **Background**: #0f172a (Dark Blue)
- **Text**: #f8fafc (Light Gray)
- **Accent**: #3b82f6 (Blue)

### Typography
- **Headings**: Inter, system-ui, sans-serif
- **Body**: Inter, system-ui, sans-serif
- **Code**: JetBrains Mono, monospace

### Components
- **Cards**: Elevated with subtle shadows
- **Buttons**: Rounded corners, hover states
- **Forms**: Floating labels, validation states
- **Charts**: Recharts integration
- **Modals**: Backdrop blur, smooth animations

## 📁 Project Structure

```
src/
├── super-admin/
│   ├── pages/                  # Page components
│   │   ├── DashboardPage.tsx
│   │   ├── TenantsPage.tsx
│   │   ├── AnalyticsPage.tsx
│   │   ├── MonitoringPage.tsx
│   │   ├── SettingsPage.tsx
│   │   └── SuperAdminLoginPage.tsx
│   ├── components/             # Reusable components
│   │   ├── SuperAdminSidebar.tsx
│   │   ├── SuperAdminHeader.tsx
│   │   ├── SuperAdminLayout.tsx
│   │   ├── StatsCard.tsx
│   │   ├── TenantCard.tsx
│   │   ├── ThemeEditor.tsx
│   │   ├── TenantForm.tsx
│   │   ├── Modal.tsx
│   │   ├── AnalyticsChart.tsx
│   │   └── SuperAdminRouteGuard.tsx
│   └── index.ts               # Export barrel
├── context/
│   └── SuperAdminAuthContext.tsx
├── SuperAdminApp.tsx           # Main app component
└── types/                      # TypeScript definitions
```

## 🛠️ Technology Stack

### Core Framework
- **React 18** - UI framework with hooks
- **TypeScript** - Type safety and better DX
- **React Router** - Client-side routing

### Styling & UI
- **Tailwind CSS** - Utility-first CSS framework
- **Lucide React** - Icon library
- **Class Variance Authority** - Component variants

### Charts & Visualization
- **Recharts** - Chart library
- **Custom chart components** - Tailored for admin dashboards

### State Management
- **React Context** - Authentication and global state
- **Local state** - Component-level state with hooks

### Development Tools
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **TypeScript** - Static type checking

## 🚦 Getting Started

### Prerequisites
- Node.js 18+
- Bun (preferred) or npm/yarn
- Access to AutoLeads backend API

### Installation
```bash
# Install dependencies
bun install

# Start development server
bun run dev

# Build for production
bun run build

# Preview production build
bun run preview
```

### Environment Variables
```env
# API Configuration
VITE_API_BASE_URL=https://api.autoleads.com
VITE_SUPER_ADMIN_API_URL=https://api.autoleads.com/super-admin

# Authentication
VITE_JWT_SECRET=your-jwt-secret
VITE_SESSION_TTL=24h

# Features
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_MONITORING=true
VITE_ENABLE_DEBUG=false
```

## 📱 Responsive Design

### Breakpoints
- **Mobile**: < 768px
- **Tablet**: 768px - 1024px
- **Desktop**: > 1024px

### Mobile Optimizations
- Collapsible sidebar navigation
- Touch-friendly interface
- Responsive charts and tables
- Optimized form layouts

## 🔐 Security Features

### Authentication
- JWT tokens with refresh mechanism
- Secure token storage
- Auto-logout on token expiry
- Protected routes and API calls

### Data Protection
- Input validation and sanitization
- XSS protection
- CSRF protection
- Secure file uploads

### Access Control
- Role-based permissions
- Route-level protection
- API endpoint guards
- Activity logging

## 🎯 Performance Optimizations

### Code Splitting
- Lazy loading for pages
- Dynamic imports for components
- Route-based code splitting

### Bundle Optimization
- Tree shaking
- Asset optimization
- Compression enabled
- Cache headers configured

### Runtime Optimizations
- React.memo for component memoization
- useCallback and useMemo for expensive operations
- Debounced search and API calls
- Virtual scrolling for large lists

## 🧪 Testing Strategy

### Component Testing
- Unit tests for core components
- Integration tests for user flows
- Mock API responses for isolated testing

### E2E Testing
- Critical user journey testing
- Cross-browser compatibility
- Mobile and desktop testing

### Performance Testing
- Bundle size analysis
- Runtime performance monitoring
- Memory leak detection

## 📊 Analytics & Monitoring

### Performance Metrics
- Page load times
- API response times
- User interaction tracking
- Error rate monitoring

### User Analytics
- Feature usage tracking
- User journey analysis
- A/B testing support
- Heatmap integration

## 🔧 Development Guidelines

### Code Standards
- TypeScript strict mode enabled
- ESLint rules enforced
- Prettier formatting
- Conventional commits

### Component Guidelines
- Single responsibility principle
- Reusable and composable
- Proper TypeScript types
- Comprehensive error handling

### API Integration
- Consistent error handling
- Loading states management
- Optimistic updates where applicable
- Request deduplication

## 🚀 Deployment

### Build Process
```bash
# Production build
bun run build

# Analyze bundle size
bun run analyze

# Preview build
bun run preview
```

### Environment Configuration
- Development: `development`
- Staging: `staging`
- Production: `production`

### Docker Support
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package.json bun.lockb ./
RUN bun install --frozen-lockfile
COPY . .
RUN bun run build
EXPOSE 3000
CMD ["bun", "run", "preview"]
```

## 📚 API Integration

### Authentication Endpoints
- `POST /api/super-admin/auth/login` - Login
- `POST /api/super-admin/auth/refresh` - Refresh token
- `POST /api/super-admin/auth/logout` - Logout
- `GET /api/super-admin/auth/me` - Get profile

### Tenant Management
- `GET /api/super-admin/tenants` - List tenants
- `POST /api/super-admin/tenants` - Create tenant
- `PUT /api/super-admin/tenants/:id` - Update tenant
- `DELETE /api/super-admin/tenants/:id` - Delete tenant

### Analytics
- `GET /api/super-admin/analytics/global` - Global analytics
- `GET /api/super-admin/analytics/tenants/:id` - Tenant analytics
- `POST /api/super-admin/analytics/export` - Export data

### Monitoring
- `GET /api/super-admin/monitoring/health` - System health
- `GET /api/super-admin/monitoring/whatsapp` - WhatsApp metrics
- `GET /api/super-admin/monitoring/logs` - Error logs

## 🐛 Troubleshooting

### Common Issues

**Authentication Issues**
- Check JWT token validity
- Verify API endpoint connectivity
- Clear browser storage and retry

**Performance Issues**
- Check bundle size with `bun run analyze`
- Monitor API response times
- Verify lazy loading is working

**Styling Issues**
- Verify Tailwind CSS configuration
- Check for CSS conflicts
- Ensure proper responsive breakpoints

### Debug Mode
Enable debug mode by setting:
```env
VITE_ENABLE_DEBUG=true
```

This will enable:
- Detailed console logging
- Component boundary debugging
- API request/response logging
- Performance metrics

## 🤝 Contributing

### Development Workflow
1. Fork the repository
2. Create feature branch
3. Make changes with proper testing
4. Submit pull request with description
5. Wait for code review
6. Address feedback if needed
7. Merge to main branch

### Code Review Checklist
- TypeScript types are correct
- Components are reusable
- Error handling is comprehensive
- Performance is optimized
- Tests are included
- Documentation is updated

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 📞 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation
- Review the FAQ section

---

**Built with ❤️ for AutoLeads Super Admin Team**