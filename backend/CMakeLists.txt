cmake_minimum_required(VERSION 3.10)
project(flight-status-board C)

set(CMAKE_C_STANDARD 99)
set(CMAKE_C_STANDARD_REQUIRED ON)

add_executable(flight-status-board src/main.c)

target_link_libraries(flight-status-board PRIVATE m pthread)

target_compile_options(flight-status-board PRIVATE -Wall -Wextra -O2)