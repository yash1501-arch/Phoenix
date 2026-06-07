# Phoenix Adventures - Admin Panel

## 🚀 Features

### Adventure Management
The admin panel provides comprehensive tools for managing adventure packages with AI-powered features:

#### ✨ AI-Powered Features

1. **PDF Itinerary Extraction**
   - Upload a PDF document containing adventure details
   - AI automatically extracts and fills the form with:
     - Adventure title and description
     - Location and duration
     - Difficulty level and pricing
     - Included/excluded items
     - Complete itinerary breakdown

2. **Itinerary Optimization**
   - Enter raw itinerary text
   - AI structures it into a professional format with:
     - Day-by-day breakdown
     - Activities list
     - Meals information
     - Accommodation details
   - Ensures logical flow and proper timing

3. **AI Description Generator**
   - Automatically generates compelling adventure descriptions
   - Creates engaging 2-3 paragraph content
   - Highlights unique features and experiences
   - Appeals to potential adventurers

#### 📝 Form Features

- **Image Upload**: Upload adventure cover images (PNG, JPG, WebP up to 5MB)
- **Dynamic Lists**: Add/remove included and excluded items with tags
- **Itinerary Builder**: Create detailed day-by-day itineraries
- **Status Management**: Set adventures as Active, Inactive, or Draft
- **Real-time Preview**: See itinerary formatting in real-time

#### 🎨 Premium UI/UX

- Dark theme with glassmorphism effects
- Smooth animations and transitions
- Responsive design for all devices
- Intuitive navigation and layout
- Loading states and error handling

## 🛠️ Setup Instructions

### Backend Setup

1. **Install Dependencies**
   ```bash
   cd backend
   npm install
   ```

2. **Configure Environment Variables**
   Create a `.env` file in the backend directory:
   ```env
   PORT=5000
   SUPABASE_URL=your_supabase_url
   SUPABASE_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_KEY=your_supabase_service_role_key
   RAZORPAY_KEY_ID=your_razorpay_key_id
   RAZORPAY_KEY_SECRET=your_razorpay_key_secret
   JWT_SECRET=your_super_secret_jwt_key
   OPENAI_API_KEY=your_openai_api_key
   ```

3. **Start Backend Server**
   ```bash
   nodemon index.js
   ```

### Admin Panel Setup

1. **Install Dependencies**
   ```bash
   cd admin
   npm install
   ```

2. **Configure Environment**
   Create a `.env` file in the admin directory:
   ```env
   VITE_API_URL=http://localhost:5000/api
   ```

3. **Start Admin Panel**
   ```bash
   npm run dev
   ```

The admin panel will be available at `http://localhost:5174`

## 📚 API Endpoints

### Adventures

- `GET /api/adventures` - Get all adventures with filters
- `GET /api/adventures/stats` - Get dashboard statistics
- `GET /api/adventures/:id` - Get single adventure
- `POST /api/adventures` - Create new adventure
- `PUT /api/adventures/:id` - Update adventure
- `DELETE /api/adventures/:id` - Delete adventure

### AI Features

- `POST /api/adventures/ai/optimize-itinerary` - Optimize itinerary with AI
- `POST /api/adventures/ai/extract-pdf` - Extract data from PDF
- `POST /api/adventures/ai/generate-description` - Generate description

### File Upload

- `POST /api/adventures/upload/images` - Upload multiple images

## 🎯 Usage Guide

### Adding a New Adventure

1. **Navigate to Adventures**
   - Click "Adventures" in the sidebar
   - Click "Add Adventure" button

2. **Option 1: Upload PDF**
   - Click "Upload Itinerary PDF" in the AI Tools section
   - Select your PDF file
   - AI will automatically fill the form

3. **Option 2: Manual Entry**
   - Fill in basic information (title, location, duration, etc.)
   - Upload adventure image
   - Add included/excluded items
   - Enter raw itinerary text
   - Click "Optimize with AI" to structure the itinerary

4. **Generate Description**
   - After filling title and location
   - Click "Generate Description" for AI-powered content

5. **Submit**
   - Review all information
   - Click "Create Adventure"

### Managing Adventures

- **View All**: See all adventures in a card-based grid
- **Search**: Find adventures by title or location
- **Filter**: Filter by status or difficulty level
- **Edit**: Click the edit icon on any adventure card
- **Delete**: Click the delete icon (with confirmation)

## 🔐 Security Notes

- Store your OpenAI API key securely in `.env`
- Never commit `.env` files to version control
- Use Supabase Row Level Security (RLS) for production
- Implement proper authentication before deploying

## 🚧 Future Enhancements

- [ ] Edit adventure functionality
- [ ] Bookings management
- [ ] User management
- [ ] Analytics and reporting
- [ ] Email notifications
- [ ] Bulk operations
- [ ] Export/Import features

## 📝 Notes

- The AI features require an OpenAI API key
- PDF extraction works best with well-formatted documents
- Image uploads are stored in the `backend/uploads/images` directory
- All AI operations have loading states for better UX

## 🐛 Troubleshooting

**AI features not working?**
- Check if OPENAI_API_KEY is set in backend `.env`
- Ensure you have sufficient OpenAI API credits
- Check backend console for error messages

**Images not uploading?**
- Verify `backend/uploads` directory exists
- Check file size (max 5MB for images)
- Ensure proper file format (PNG, JPG, WebP)

**Admin panel not connecting to backend?**
- Verify backend is running on port 5000
- Check VITE_API_URL in admin `.env`
- Look for CORS errors in browser console

## 📞 Support

For issues or questions, please check the main project documentation or create an issue in the repository.
