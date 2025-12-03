# Phone Price Tracker 📱

A modern web application for tracking and analyzing phone model prices across different variants and time periods.

## Features

- 📊 **Interactive Charts** - Price trends and distribution visualization
- 💰 **Real-time Stats** - Current, min, max, and average prices
- 🔍 **Dynamic Filters** - Filter by model, color, RAM, and storage
- 🎨 **Modern UI** - Dark mode with glassmorphism effects
- ☁️ **AWS Integration** - Connects to Athena for live data
- 📱 **Responsive Design** - Works on all devices

## Tech Stack

- **Backend**: FastAPI (Python)
- **Frontend**: HTML, CSS, JavaScript
- **Charts**: Chart.js
- **Data Source**: AWS Athena (with mock data fallback)
- **Deployment**: EC2, Nginx, Systemd

## Quick Start (Local Development)

### Prerequisites
- Python 3.8+
- pip

### Installation

1. **Clone the repository**
```bash
git clone <your-repo-url>
cd product-hunt
```

2. **Create virtual environment**
```bash
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. **Install dependencies**
```bash
pip install -r requirements.txt
```

4. **Configure environment** (optional)
```bash
cp .env.example .env
# Edit .env with your AWS credentials if using Athena
```

5. **Run the application**
```bash
python run.py
```

6. **Open browser**
Navigate to `http://localhost:8000`

## Configuration

### Environment Variables

Create a `.env` file in the project root:

```env
# AWS Configuration (for Athena)
AWS_REGION=us-east-1
ATHENA_DATABASE=your_database_name
ATHENA_TABLE=your_table_name
ATHENA_OUTPUT_LOCATION=s3://your-bucket/athena-results/

# Application Configuration
USE_MOCK_DATA=true  # Set to 'false' to use Athena
HOST=0.0.0.0
PORT=8000
```

### Mock Data vs Athena

- **Development**: Set `USE_MOCK_DATA=true` to use synthetic data
- **Production**: Set `USE_MOCK_DATA=false` to query Athena

## Deployment to EC2

See [EC2 Deployment Guide](ec2_deployment_guide.md) for detailed instructions on:
- Setting up EC2 instance
- Configuring IAM roles for Athena access
- Installing dependencies
- Setting up Nginx reverse proxy
- Configuring systemd service
- SSL certificate setup

## Project Structure

```
product-hunt/
├── backend/
│   ├── __init__.py
│   ├── main.py           # FastAPI application
│   └── data_loader.py    # Data loading (Athena/Mock)
├── frontend/
│   ├── index.html        # Main page
│   ├── styles.css        # Styling
│   └── app.js            # JavaScript logic
├── venv/                 # Virtual environment
├── .env                  # Environment variables (not in git)
├── .env.example          # Example environment config
├── .gitignore
├── requirements.txt      # Python dependencies
├── run.py               # Development server
└── README.md
```

## API Endpoints

- `GET /` - Main dashboard
- `GET /api/models` - List of phone models
- `GET /api/data` - Price data (with filters)
- `GET /api/stats` - Price statistics
- `GET /api/price-history/{model}` - Historical prices
- `GET /api/filters` - Available filter options

## Development

### Running in Development Mode
```bash
source venv/bin/activate
python run.py
```

### Running with Uvicorn Directly
```bash
uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
```

## Athena Table Schema

Your Athena table should have the following columns:

| Column    | Type      | Description                    |
|-----------|-----------|--------------------------------|
| color     | string    | Phone color variant            |
| ram       | string    | RAM size (e.g., "8GB")         |
| storage   | string    | Storage size (e.g., "128GB")   |
| price     | double    | Price in INR                   |
| timestamp | timestamp | Date/time of price record      |
| model     | string    | Phone model name               |

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License

## Support

For issues and questions, please open an issue on GitHub.
# product-hunt
