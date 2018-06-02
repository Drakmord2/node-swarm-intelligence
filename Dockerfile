
# Node Image
FROM node

# Environment
ENV APP_ROOT="/var/www/node"

# Set the application root
WORKDIR ${APP_ROOT}

# Install Nodemon
RUN npm i -g nodemon

# Install Express Generator
RUN npm install -g express-generator

# Install MathJS
RUN npm install -g mathjs

# Install dependencies
ADD package.json /tmp/package.json
RUN cd /tmp && npm install
RUN cp -a /tmp/node_modules /var/www/
RUN cp /tmp/package-lock.json /var/www/node

# Listen to port
EXPOSE 8181

# Setup application
COPY ./devops/start.sh /opt/start.sh
RUN chmod 755 /opt/start.sh

# Start application
ENTRYPOINT [ "/opt/start.sh" ]
