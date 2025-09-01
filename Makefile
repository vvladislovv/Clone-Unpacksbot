# Unpacker Clone - Development Commands

.PHONY: help build start stop restart logs clean install test lint format

# Default target
help:
	@echo "Available commands:"
	@echo "  build     - Build all Docker containers"
	@echo "  start     - Start all services"
	@echo "  stop      - Stop all services"
	@echo "  restart   - Restart all services"
	@echo "  logs      - Show logs for all services"
	@echo "  clean     - Clean up containers and volumes"
	@echo "  install   - Install dependencies for all services"
	@echo "  test      - Run tests"
	@echo "  lint      - Run linters"
	@echo "  format    - Format code"
	@echo "  db-reset  - Reset database"
	@echo "  db-seed   - Seed database with test data"

# Docker commands
build:
	docker-compose build

start:
	docker-compose up -d
	@echo "🚀 Services are starting..."
	@echo "Frontend: http://localhost:3000"
	@echo "Backend API: http://localhost:3001"
	@echo "Admin Panel: http://localhost:3002"
	@echo "API Documentation: http://localhost:3001/docs"

stop:
	docker-compose down

restart:
	docker-compose down
	docker-compose up -d

logs:
	docker-compose logs -f

logs-backend:
	docker-compose logs -f backend

logs-frontend:
	docker-compose logs -f frontend

logs-telegram:
	docker-compose logs -f telegram-bot

# Development commands
install:
	@echo "Installing backend dependencies..."
	cd backend && npm install
	@echo "Installing frontend dependencies..."
	cd frontend && npm install
	@echo "Installing telegram-bot dependencies..."
	cd telegram-bot && npm install
	@echo "Installing admin dependencies..."
	cd admin && npm install

test:
	@echo "Running backend tests..."
	cd backend && npm test
	@echo "Running frontend tests..."
	cd frontend && npm test
	@echo "Running telegram-bot tests..."
	cd telegram-bot && npm test

lint:
	@echo "Running backend linter..."
	cd backend && npm run lint
	@echo "Running frontend linter..."
	cd frontend && npm run lint

format:
	@echo "Formatting backend code..."
	cd backend && npm run format
	@echo "Formatting frontend code..."
	cd frontend && npm run format

# Database commands
db-reset:
	docker-compose down postgres
	docker volume rm unpacker_postgres_data || true
	docker-compose up -d postgres
	@echo "Waiting for database to start..."
	sleep 10
	@echo "Running migrations..."
	cd backend && npm run prisma:migrate

db-seed:
	cd backend && npm run prisma:seed

db-migrate:
	cd backend && npm run prisma:migrate

db-studio:
	cd backend && npm run prisma:studio

# Cleanup commands
clean:
	docker-compose down -v
	docker system prune -f
	docker volume prune -f

clean-all:
	docker-compose down -v --rmi all
	docker system prune -af
	docker volume prune -f

# Production commands
build-prod:
	docker-compose -f docker-compose.yml -f docker-compose.prod.yml build

start-prod:
	docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Development mode (with hot reload)
dev:
	@echo "Starting development environment..."
	docker-compose up -d postgres redis
	@echo "Waiting for services to start..."
	sleep 5
	@echo "Starting backend in dev mode..."
	cd backend && npm run dev &
	@echo "Starting frontend in dev mode..."
	cd frontend && npm run dev &
	@echo "Starting telegram bot in dev mode..."
	cd telegram-bot && npm run dev &
	@echo "Development servers are starting..."
	@echo "Press Ctrl+C to stop all services"

# Health check
health:
	@echo "Checking service health..."
	@curl -f http://localhost:3000/api/health || echo "Frontend: ❌"
	@curl -f http://localhost:3001/health || echo "Backend: ❌"
	@echo "Services health check completed"

# Backup commands
backup:
	@echo "Creating database backup..."
	docker-compose exec postgres pg_dump -U unpacker_user unpacker > backup_$(shell date +%Y%m%d_%H%M%S).sql
	@echo "Backup created successfully"

restore:
	@echo "Restoring database from backup..."
	@read -p "Enter backup file name: " file; \
	docker-compose exec -T postgres psql -U unpacker_user unpacker < $$file

# Monitoring
monitor:
	@echo "Monitoring services..."
	docker-compose logs -f --tail=100

stats:
	docker stats $(shell docker-compose ps -q)

# Certificate generation (for HTTPS)
generate-certs:
	mkdir -p nginx/ssl
	openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
		-keyout nginx/ssl/key.pem \
		-out nginx/ssl/cert.pem \
		-subj "/C=RU/ST=Moscow/L=Moscow/O=UnpackerClone/CN=localhost"

# Environment setup
setup-env:
	@if [ ! -f .env ]; then \
		cp env.example .env; \
		echo "Created .env file from env.example"; \
		echo "Please edit .env file with your configuration"; \
	else \
		echo ".env file already exists"; \
	fi

# Complete setup for new developers
setup: setup-env install build db-reset db-seed
	@echo "🎉 Setup complete!"
	@echo "Run 'make start' to start the application"

# Quick start (for existing setup)
quick-start: start
	@echo "⚡ Quick start complete!"
