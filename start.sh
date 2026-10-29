#!/bin/bash

# Start NGINX server in the background
nginx -g 'daemon off;' &

# Wait for the NGINX server to start (optional)
sleep 5

# Now that the NGINX server is running, you can start your React application
yarn start
