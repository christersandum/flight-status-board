# Deployment Guide for Railway

## Overview
This guide provides comprehensive instructions for deploying the Flight Status Board application using Railway.

## Steps for Deploying
1. **Sign Up/Log In to Railway**: Create an account on [Railway](https://railway.app).
2. **Create a New Project**: After logging in, click on "New Project".
3. **Connect Your GitHub Repository**: Link your GitHub account to Railway and select the `christersandum/flight-status-board` repository.
4. **Configure Your Project**: Set your environment settings, and ensure that your `Railway.json` is correctly configured for the build. 
5. **Deploy**: Click on "Deploy" to build and deploy your application.

## Auto-Deploy on Git Push
To enable automatic deployment on each push to the main branch:
1. In the Railway dashboard, navigate to the project settings.
2. Enable the "Auto Deploy" feature.
   - This will trigger a deployment whenever changes are pushed to the main branch of your GitHub repository.

## Custom Free Domain Setup with Freenom
1. **Register a Domain**: Visit [Freenom](https://www.freenom.com), search for a desired domain, and register it.
2. **Configure DNS**: Go to the Railway project settings and add a custom domain. Follow the instructions to point your domain to Railway by updating the DNS settings in Freenom.
3. **SSL Certificate**: Railway automatically provides SSL for custom domains, ensuring secure connections.

## Environment Variables Configuration
1. In the Railway project, navigate to the settings tab.
2. Add required environment variables:
   - `NODE_ENV`: Set to `production`.
   - Other variables as per your application’s requirement.

## Monitoring
- Railway provides real-time logs for monitoring the deployment. Go to the "Logs" tab in your Railway project to access the log stream.
- Consider integrating an external monitoring tool like Sentry or New Relic for enhanced observability.

## Troubleshooting
1. **Check Logs**: If something goes wrong, check the logs in the Railway dashboard for errors.
2. **Debugging**: You can utilize Railway's remote access feature to debug environment issues directly.
3. **Consult Documentation**: Refer to the [Railway Documentation](https://docs.railway.app) for specific error codes or setup issues.

## Security Best Practices
1. Always use environment variables for sensitive data instead of hardcoding them into the codebase.
2. Regularly review access permissions on your Railway account and GitHub repository.
3. Keep dependencies updated to minimize security vulnerabilities.
4. Utilize Railway’s built-in security measures for production environments.

---

For further assistance, contact your system administrator or consult the Railway support team.