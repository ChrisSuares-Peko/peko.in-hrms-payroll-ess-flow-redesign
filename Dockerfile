# Use an official Node runtime as a base image
FROM node:22.18.0 as builder

# Set the working directory in the container
WORKDIR /app

# Copy package.json and yarn.lock to the working directory
COPY package.json yarn.lock ./

# Install dependencies using Yarn
RUN yarn install

# Copy the entire project to the working directory
COPY . .

# Build the React app
RUN yarn build

# Stage 2: Serve the built React app using a lightweight HTTP server
FROM nginx:alpine

# Copy the build output from the previous stage to the NGINX server directory
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy the Nginx configuration file
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80 to the outside world
EXPOSE 80

# Start NGINX server when the container launches
CMD ["nginx", "-g", "daemon off;"]
