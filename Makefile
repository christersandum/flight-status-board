.PHONY: help install dev start build docker-build docker-run clean test

help:
	@echo "Flight Status Board - Available Commands:"
	@echo ""
	@echo "  make install      - Install dependencies"
	@echo "  make dev          - Run development server"
	@echo "  make start        - Run production server"
	@echo "  make build        - Build Docker image"
	@echo "  make docker-run   - Run Docker container"
	@echo "  make clean        - Clean build artifacts"
	@echo "  make test         - Test the application"
	@echo ""

install:
	npm install

dev:
	npm run dev

start:
	npm start

build:
	docker build -t flight-status-board:latest .

docker-run:
	docker run -p 8080:8080 flight-status-board:latest

docker-compose-up:
	docker-compose up --build

docker-compose-down:
	docker-compose down

clean:
	rm -rf node_modules
	rm -f package-lock.json

test:
	@echo "Testing backend API..."
	@curl -s http://localhost:8080/health | grep -q "ok" && echo "✓ Health check passed" || echo "✗ Health check failed"
	@curl -s http://localhost:8080/api/countries | grep -q "Norway" && echo "✓ Countries endpoint passed" || echo "✗ Countries endpoint failed"
	@curl -s http://localhost:8080/api/airports | grep -q "OSL" && echo "✓ Airports endpoint passed" || echo "✗ Airports endpoint failed"
