# Lead Distribution CRM System

A full-stack CRM web application that automates lead assignment, manages sales performance, and visualizes results for admins and salespeople.

## 🚀 Features

### Admin Panel
- **Lead Upload**: Upload CSV/Excel files with automatic lead distribution
- **Dashboard**: Real-time KPIs, charts, and performance metrics
- **Team Management**: Add, edit, and manage salesperson accounts
- **Reports**: Generate and download performance reports
- **Leaderboard**: Track top performers with rankings

### Salesperson Dashboard
- **Performance Tracking**: Weekly and monthly targets vs achievements
- **Lead Management**: Color-coded lead status (Fresh, Follow-up, Dead, Closed)
- **Click-to-Call**: Direct calling integration via phone links
- **Activity Tracking**: Notes, reminders, and lead history
- **Leaderboard**: View rankings and compete with peers

## 🛠️ Tech Stack

### Frontend
- React.js 18
- Vite
- TailwindCSS
- Recharts (data visualization)
- React Router DOM
- Axios
- React Hot Toast

### Backend
- Node.js
- Express.js
- PostgreSQL / Supabase
- Sequelize ORM
- JWT Authentication
- Multer (file uploads)
- Bcrypt.js

## 📦 Installation

### Prerequisites
- Node.js (v16 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

### Backend Setup

1. Navigate to server directory:
```bash
cd server
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file:
```bash
cp .env.example .env
```

4. Configure your `.env` file:
```env
PORT=5000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=crm_database
DB_USER=postgres
DB_PASSWORD=your_password
JWT_SECRET=your_secret_key
ADMIN_EMAIL=admin@rmaverseas.com
ADMIN_PASSWORD=admin123
```

5. Create PostgreSQL database:
```sql
CREATE DATABASE crm_database;
```

6. Start the server:
```bash
npm run dev
```

The server will run on `http://localhost:5000`

### Frontend Setup

1. Navigate to client directory:
```bash
cd client
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file:
```bash
cp .env.example .env
```

4. Configure your `.env` file:
```env
VITE_API_URL=http://localhost:5000/api
```

5. Start the development server:
```bash
npm run dev
```

The app will run on `http://localhost:3000`

## 👤 Default Credentials

**Admin Account:**
- Email: `admin@rmaverseas.com`
- Password: `admin123`

## 📊 Lead Upload Format

Your CSV/Excel file should contain the following columns:

| Column | Required | Description |
|--------|----------|-------------|
| name | Yes | Lead's full name |
| phone | Yes | Contact phone number |
| email | No | Email address |
| company | No | Company name |
| source | No | Lead source |
| value | No | Potential deal value |
| notes | No | Additional notes |

### Sample CSV:
```csv
name,phone,email,company,source,value,notes
John Doe,1234567890,john@example.com,Acme Inc,Website,5000,Interested in premium plan
Jane Smith,0987654321,jane@example.com,Tech Corp,Referral,3000,Follow up next week
```

## 🎨 Lead Status Colors

- **White** → Fresh (New leads)
- **Orange** → Follow-up (Requires follow-up)
- **Red** → Dead (Lost opportunity)
- **Green** → Closed (Successful conversion)

## 🔐 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - Register new user
- `GET /api/auth/me` - Get current user

### Leads
- `POST /api/leads/upload` - Upload leads (Admin)
- `GET /api/leads` - Get all leads (Admin)
- `GET /api/leads/my-leads` - Get salesperson's leads
- `GET /api/leads/:id` - Get single lead
- `PUT /api/leads/:id` - Update lead
- `DELETE /api/leads/:id` - Delete lead (Admin)
- `POST /api/leads/:id/activity` - Add activity/note

### Users
- `GET /api/users/salespeople` - Get all salespeople (Admin)
- `POST /api/users/salespeople` - Create salesperson (Admin)
- `PUT /api/users/salespeople/:id` - Update salesperson (Admin)
- `DELETE /api/users/salespeople/:id` - Deactivate salesperson (Admin)

### Dashboard
- `GET /api/dashboard/admin` - Admin dashboard stats
- `GET /api/dashboard/salesperson` - Salesperson dashboard stats
- `GET /api/dashboard/leaderboard?period=week|month` - Get leaderboard

## 🚀 Deployment

### Frontend (Vercel)
```bash
cd client
npm run build
vercel --prod
```

### Backend (Render/AWS)
1. Push code to GitHub
2. Connect repository to Render/AWS
3. Set environment variables
4. Deploy

## 📝 Key Features Implementation

### Auto Lead Distribution
- Leads are distributed evenly using round-robin algorithm
- Only active salespeople receive leads
- Distribution summary provided after upload

### Color-Coded Status System
- Visual indicators for lead status
- Easy identification of lead stage
- Consistent across all views

### Performance Tracking
- Real-time dashboard updates
- Weekly and monthly metrics
- Target vs achievement comparison
- Conversion rate calculations

### Leaderboard System
- Weekly and monthly rankings
- Star performer highlighting
- Revenue and conversion tracking
- Competitive gamification

## 🔧 Customization

### Adding New Lead Fields
1. Update database model in `server/models/Lead.js`
2. Update file parser in `server/utils/fileParser.js`
3. Update frontend forms and displays

### Changing Distribution Logic
Modify `server/utils/leadDistributor.js` to implement custom distribution algorithms.

## 📱 Mobile Responsiveness

The application is fully responsive and works on:
- Desktop (1920px+)
- Laptop (1024px - 1919px)
- Tablet (768px - 1023px)
- Mobile (320px - 767px)

## 🐛 Troubleshooting

### Database Connection Issues
- Ensure PostgreSQL is running
- Verify database credentials in `.env`
- Check if database exists

### Port Already in Use
```bash
# Kill process on port 5000
npx kill-port 5000

# Or change port in .env
PORT=5001
```

### CORS Errors
- Ensure backend CORS is configured
- Check API URL in frontend `.env`

## 📄 License

MIT License - feel free to use this project for personal or commercial purposes.

## 👥 Support

For issues and questions:
- Create an issue on GitHub
- Contact: admin@crm.com

## 🎯 Future Enhancements

- [ ] Email notifications
- [ ] WhatsApp integration
- [ ] Advanced analytics
- [ ] Export to PDF reports
- [ ] Mobile app (React Native)
- [ ] AI-powered lead scoring
- [ ] Calendar integration
- [ ] SMS reminders

---

Built with ❤️ using React, Node.js, and PostgreSQL
