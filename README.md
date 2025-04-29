# Move-37 Production Assignment

This project is a video processing application that supports trimming, adding subtitles, and rendering videos. It uses technologies like Node.js, TypeScript, Prisma, and AWS S3 for storage.

## Features

- Video upload and processing
- Trimming videos
- Adding subtitles
- Rendering videos
- Integration with AWS S3 for storage
- Job queue management with BullMQ

## Prerequisites

- Node.js (>= 18)
- pnpm (>= 10.4.1)
- PostgreSQL database
- AWS S3 credentials
- Redis server

## Setup Instructions

1. **Clone the Repository**

   ```bash
   git clone <repository-url>
   cd move-37-prod-assignment
   ```

2. **Install Dependencies**

   ```bash
   pnpm install
   ```

3. **Configure Environment Variables**
   Create a `.env` file in the root directory and add the following variables:

   ```
   DATABASE_URL=postgresql://<username>:<password>@<host>:<port>/<database>
   AWS_ACCESS_KEY_ID=<your-aws-access-key-id>
   AWS_SECRET_ACCESS_KEY=<your-aws-secret-access-key>
   AWS_REGION=<your-aws-region>
   S3_BUCKET_NAME=<your-s3-bucket-name>
   REDIS_URL=redis://<host>:<port>
   ```

4. **Set Up the Database**
   Run the following commands to set up the database schema:

   ```bash
   pnpm prisma migrate dev
   ```

5. **Start the Application**

   - For development:
     ```bash
     pnpm dev
     ```
   - For production:
     ```bash
     pnpm start
     ```

6. **Directory Structure**

   - `src/config`: Configuration files
   - `src/routes`: API route handlers
   - `src/workers`: Background job workers
   - `temp`: Temporary directories for uploads, downloads, and renders

7. **Temporary Directories**
   The application uses the following directories for temporary file storage:

   - `temp/uploads`: For uploaded files
   - `temp/downloads`: For downloaded files
   - `temp/trims`: For trimmed videos
   - `temp/subs`: For subtitle files
   - `temp/subbed`: For videos with subtitles
   - `temp/render`: For rendered videos

   These directories are automatically created if they do not exist.

## Notes

- Ensure that the PostgreSQL database and Redis server are running before starting the application.
- The application uses Prisma for database interactions. Refer to the `prisma/schema.prisma` file for the database schema.
- AWS S3 is used for storing processed videos. Ensure that the S3 bucket is properly configured.
- The application uses BullMQ for job queue management. Redis is required for this functionality.

## License

This project is licensed under the ISC License.
