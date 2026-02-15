CC = gcc
CFLAGS = -Wall -Wextra -O2 -std=c99
LDFLAGS = -lm -lpthread -lcurl
SRC_DIR = src
BUILD_DIR = build
TARGET = $(BUILD_DIR)/flight-status-board

SRCS = $(SRC_DIR)/main.c $(SRC_DIR)/api.c $(SRC_DIR)/flight_data.c
OBJS = $(SRCS:$(SRC_DIR)/%.c=$(BUILD_DIR)/%.o)

.PHONY: all clean

all: $(BUILD_DIR) $(TARGET)

$(BUILD_DIR):
	mkdir -p $(BUILD_DIR)

$(TARGET): $(OBJS)
	$(CC) $(OBJS) -o $(TARGET) $(LDFLAGS)

$(BUILD_DIR)/%.o: $(SRC_DIR)/%.c
	$(CC) $(CFLAGS) -c $< -o $@

clean:
	rm -rf $(BUILD_DIR)

run: $(TARGET)
	$(TARGET)
