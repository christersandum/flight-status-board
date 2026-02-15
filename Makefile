CC = gcc
CFLAGS = -Wall -Wextra -std=c99
LDFLAGS = -lcurl
TARGET = flight-server
SRC = backend/server.c

.PHONY: all clean run

all: $(TARGET)

$(TARGET): $(SRC)
	$(CC) $(CFLAGS) -o $(TARGET) $(SRC) $(LDFLAGS)

run: $(TARGET)
	./$(TARGET)

clean:
	rm -f $(TARGET)

help:
	@echo "Flight Status Board - Makefile commands:"
	@echo "  make        - Build the server"
	@echo "  make run    - Build and run the server"
	@echo "  make clean  - Remove build artifacts"
	@echo ""
	@echo "After starting the server, open http://localhost:8080 in your browser"
