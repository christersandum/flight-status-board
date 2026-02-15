cmake_minimum_required(VERSION 3.10)
project(flight-status-board C)

set(CMAKE_C_STANDARD 99)
set(CMAKE_C_STANDARD_REQUIRED ON)

# Find cURL library
find_package(CURL REQUIRED)

# Add executable with all source files
add_executable(flight-status-board 
    src/main.c
    src/api.c
    src/flight_data.c
)

# Include directories
target_include_directories(flight-status-board PRIVATE 
    ${CMAKE_CURRENT_SOURCE_DIR}/src
    ${CURL_INCLUDE_DIRS}
)

# Link libraries
target_link_libraries(flight-status-board PRIVATE 
    m 
    pthread
    ${CURL_LIBRARIES}
)

# Compiler options
target_compile_options(flight-status-board PRIVATE -Wall -Wextra -O2)