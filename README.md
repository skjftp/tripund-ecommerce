# TRIPUND E-commerce Platform

A full-stack e-commerce platform for TRIPUND Lifestyle - connecting premium Indian artisans with global customers.

## 🚀 Features

### Customer Features
- **Product Browsing**: Browse products by categories, filters, and search
- **User Authentication**: Secure JWT-based authentication system
- **Shopping Cart**: Add, remove, and manage items in cart
- **Wishlist**: Save products for later
- **Checkout**: Complete checkout flow with address management
- **Payment Integration**: Razorpay payment gateway integration
- **Order Tracking**: Track order status and history
- **User Profile**: Manage addresses, preferences, and account settings

### Backend Features
- **RESTful API**: Built with Go and Gin framework
- **Firebase Integration**: Firestore for database, Cloud Storage for files
- **JWT Authentication**: Secure token-based authentication
- **Payment Processing**: Razorpay integration for Indian payments
- **Cloud Deployment**: Deployed on Google Cloud Run with auto-scaling

### Technical Stack

#### Backend
- **Language**: Go 1.23+
- **Framework**: Gin Web Framework
- **Database**: Firebase Firestore
- **Authentication**: JWT
- **Payment**: Razorpay
- **Deployment**: Google Cloud Run

#### Frontend
- **Framework**: React 18 with TypeScript
- **State Management**: Redux Toolkit
- **Styling**: Tailwind CSS
- **Build Tool**: Vite
- **Form Handling**: React Hook Form with Zod validation

## 🛠️ Installation

### Prerequisites
- Go 1.23+
- Node.js 18+
- Google Cloud CLI
- Firebase/Firestore account

### Backend Setup

1. Clone the repository:
```bash
git clone https://github.com/yourusername/tripund-ecommerce.git
cd tripund-ecommerce/backend-api
```

2. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. Install dependencies:
```bash
go mod download
```

4. Run locally:
```bash
go run cmd/server/main.go
```

### Frontend Setup

1. Navigate to frontend:
```bash
cd web-frontend
```

2. Install dependencies:
```bash
npm install
```

3. Run development server:
```bash
npm run dev
```

## 🚀 Deployment

### Backend Deployment (Google Cloud Run)

The backend is already deployed at: https://tripund-backend-rafqv5m7ga-el.a.run.app

To deploy updates:
```bash
cd backend-api
./deploy.sh
```

### Frontend Deployment Options

#### Vercel (Recommended)
```bash
cd web-frontend
npm run build
vercel
```

#### Netlify
```bash
cd web-frontend
npm run build
netlify deploy --prod --dir=dist
```

## 📁 Project Structure

```
tripund-ecommerce/
├── backend-api/          # Go backend API
│   ├── cmd/             # Application entrypoints
│   ├── internal/        # Private application code
│   │   ├── config/      # Configuration
│   │   ├── database/    # Database connections
│   │   ├── handlers/    # HTTP handlers
│   │   ├── middleware/  # HTTP middleware
│   │   └── models/      # Data models
│   └── deploy.sh        # Deployment script
├── web-frontend/        # React frontend
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── pages/       # Page components
│   │   ├── services/    # API services
│   │   ├── store/       # Redux store
│   │   └── types/       # TypeScript types
│   └── package.json
├── admin-panel/         # Admin dashboard (structure)
├── mobile-app/          # Flutter mobile app (structure)
└── docs/               # Documentation

```

## 🔧 Configuration

### Environment Variables

#### Backend (.env)
```env
PORT=8080
GIN_MODE=release
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CREDENTIALS_PATH=./serviceAccount.json
RAZORPAY_KEY_ID=your-razorpay-key
RAZORPAY_KEY_SECRET=your-razorpay-secret
JWT_SECRET=your-jwt-secret
CORS_ORIGIN=https://yourdomain.com
```

#### Frontend (.env)
```env
VITE_API_URL=https://your-backend-url.com/api
```

## 📚 API Documentation

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update profile

### Products
- `GET /api/products` - List products
- `GET /api/products/:id` - Get product details
- `GET /api/categories` - List categories

### Cart & Orders
- `POST /api/cart` - Add to cart
- `GET /api/orders` - Get user orders
- `POST /api/orders` - Create order

### Payment
- `POST /api/payment/create-order` - Create Razorpay order
- `POST /api/payment/verify` - Verify payment

## 🧪 Testing

### Backend Tests
```bash
cd backend-api
go test ./...
```

### Frontend Tests
```bash
cd web-frontend
npm test
```

## 🔒 Security

- JWT-based authentication
- CORS configuration
- Environment variable management
- Secure payment processing with Razorpay
- HTTPS enforced in production

## 📈 Performance

- Cloud Run auto-scaling
- Database indexing with Firestore
- Image optimization
- Code splitting in frontend
- Lazy loading of components

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is proprietary software for TRIPUND Lifestyle.

## 🛟 Support

For support, email support@tripundlifestyle.com

## 🙏 Acknowledgments

- Built with modern web technologies
- Deployed on Google Cloud Platform
- Payment processing by Razorpay

---

**Live Backend**: https://tripund-backend-rafqv5m7ga-el.a.run.app

**Status**: ✅ Production Ready