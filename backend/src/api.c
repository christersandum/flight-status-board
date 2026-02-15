#include "api.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <curl/curl.h>

// Callback function for libcurl to write response data
static size_t write_callback(void *contents, size_t size, size_t nmemb, void *userp) {
    size_t realsize = size * nmemb;
    APIResponse *mem = (APIResponse *)userp;

    char *ptr = realloc(mem->data, mem->size + realsize + 1);
    if (ptr == NULL) {
        fprintf(stderr, "Not enough memory (realloc returned NULL)\n");
        return 0;
    }

    mem->data = ptr;
    memcpy(&(mem->data[mem->size]), contents, realsize);
    mem->size += realsize;
    mem->data[mem->size] = 0;

    return realsize;
}

// Fetch URL using libcurl
char* fetch_url(const char *url) {
    CURL *curl;
    CURLcode res;
    APIResponse response = {0};

    curl_global_init(CURL_GLOBAL_DEFAULT);
    curl = curl_easy_init();

    if (curl) {
        curl_easy_setopt(curl, CURLOPT_URL, url);
        curl_easy_setopt(curl, CURLOPT_WRITEFUNCTION, write_callback);
        curl_easy_setopt(curl, CURLOPT_WRITEDATA, (void *)&response);
        curl_easy_setopt(curl, CURLOPT_USERAGENT, "flight-status-board/1.0");
        curl_easy_setopt(curl, CURLOPT_TIMEOUT, 30L);
        curl_easy_setopt(curl, CURLOPT_FOLLOWLOCATION, 1L);

        res = curl_easy_perform(curl);

        if (res != CURLE_OK) {
            fprintf(stderr, "curl_easy_perform() failed: %s\n", curl_easy_strerror(res));
            free(response.data);
            response.data = NULL;
        }

        curl_easy_cleanup(curl);
    }

    curl_global_cleanup();
    return response.data;
}

// Fetch flight data from API
APIResponse fetch_flight_data(const char *airport_code) {
    APIResponse response = {0};
    
    // Using OpenSky API (free, no API key required)
    char url[512];
    snprintf(url, sizeof(url), 
             "https://opensky-network.org/api/flights/departure?airport=%s&begin=%ld&end=%ld",
             airport_code, (long)(time(NULL) - 86400), (long)time(NULL));

    response.data = fetch_url(url);
    if (response.data) {
        response.size = strlen(response.data);
    }

    return response;
}

// Free API response memory
void free_api_response(APIResponse *response) {
    if (response && response->data) {
        free(response->data);
        response->data = NULL;
        response->size = 0;
    }
}
