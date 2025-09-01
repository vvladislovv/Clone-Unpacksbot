#!/bin/bash

# Unpacker Clone - Quick Start Script

echo "🚀 Starting Unpacker Clone platform..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Check if docker-compose is available
if ! command -v docker-compose &> /dev/null; then
    echo "❌ docker-compose is not installed. Please install it first."
    exit 1
fi

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp env.example .env
    echo "✅ .env file created. Please edit it with your configuration."
    echo "⚠️  Important: Set your Telegram bot token and other credentials in .env file"
fi

# Create uploads directory
mkdir -p uploads

echo "🏗️  Building containers..."
docker-compose build

echo "🚀 Starting services..."
docker-compose up -d

echo "⏳ Waiting for services to start..."
sleep 10

# Check if services are running
echo "🔍 Checking service health..."

# Wait for database to be ready
echo "📊 Waiting for database..."
until docker-compose exec -T postgres pg_isready -U unpacker_user -d unpacker; do
    echo "⏳ Database is starting..."
    sleep 2
done

# Run database migrations
echo "🗄️  Running database migrations..."
docker-compose exec -T backend npm run prisma:migrate deploy || echo "⚠️ Migration failed, continuing..."

echo ""
echo "✅ Unpacker Clone is running!"
echo ""
echo "📊 Services:"
echo "   Frontend:    http://localhost:3000"
echo "   Backend API: http://localhost:3001"
echo "   Admin Panel: http://localhost:3002"
echo "   API Docs:    http://localhost:3001/docs"
echo ""
echo "🗄️  Database:"
echo "   PostgreSQL:  localhost:5432"
echo "   Redis:       localhost:6379"
echo ""
echo "📝 Logs:"
echo "   All services: make logs"
echo "   Backend only: make logs-backend"
echo "   Frontend only: make logs-frontend"
echo ""
echo "🛑 To stop services: make stop"
echo "🔄 To restart: make restart"
echo ""

# Show container status
echo "📋 Container status:"
docker-compose ps

echo ""
echo "🎉 Setup complete! Visit http://localhost:3000 to get started."
