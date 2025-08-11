# Batak Lineage - A Digital Tarombo

This project is a web application dedicated to the digital preservation and exploration of Batak genealogy, known as *tarombo*. It provides an interactive and collaborative platform for the Batak community and researchers to view, manage, and contribute to a comprehensive family tree.

## ✨ Features

- **Interactive Lineage Graph**: A dynamic, zoomable, and pannable graph displays the entire family tree. Users can click on individuals to view their profiles.
- **Search Functionality**: Quickly find any ancestor in the lineage by searching for their name.
- **Collapsible Nodes**: Easily manage large branches of the family tree by collapsing and expanding nodes to show or hide their descendants.
- **Contributor-Only Editing**: Secure user registration and login system for contributors to ensure data integrity.
- **Visual Tree Editor**:
    - **Add/Edit/Delete**: Authenticated contributors can add new individuals, edit existing profiles (name, wife, description), or remove people from the tree.
    - **Reparenting**: Easily change an individual's parent or make them a root node.
    - **Sibling Reordering**: Intuitive up/down arrows allow for the reordering of siblings to reflect the correct birth order.
- **Admin Panel**: A dedicated section for administrators to manage user accounts and review data submissions.
- **Static Content Pages**: Informative pages like "About," "How to Contribute," and "Donation" to engage the community.

## 🚀 Tech Stack

This project is built with a modern, robust, and scalable technology stack:

- **Framework**: [Next.js](https://nextjs.org/) (with App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Database ORM**: [Prisma](https://www.prisma.io/)
- **Database**: [PostgreSQL](https://www.postgresql.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **UI Components**: [ShadCN/UI](https://ui.shadcn.com/)
- **Genealogy Visualization**: [React Flow](https://reactflow.dev/)
- **Authentication**: [bcrypt](https://www.npmjs.com/package/bcrypt) for password hashing
- **IDs**: [UUID](https://www.npmjs.com/package/uuid) for unique database records

## 🛠️ Getting Started

Follow these instructions to get a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

- [Node.js](https://nodejs.org/en/) (v20.x or later recommended)
- [npm](https://www.npmjs.com/) or a compatible package manager
- A running [PostgreSQL](https://www.postgresql.org/download/) database instance

### 1. Set Up Environment Variables

Create a `.env` file in the root of the project and add your PostgreSQL database connection string:

```env
# Example connection URL
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public"
```

Replace `USER`, `PASSWORD`, `HOST`, `PORT`, and `DATABASE` with your actual database credentials.

### 2. Install Dependencies

Install the project dependencies using npm:

```bash
npm install
```

### 3. Run Database Migrations

Apply the database schema to your PostgreSQL instance using Prisma Migrate. This will create all the necessary tables.

```bash
npx prisma migrate dev
```

When prompted, provide a name for the migration (e.g., `initial_setup`).

### 4. Seed the Database

Populate the database with the initial lineage data and a default admin user using the seed script:

```bash
npx prisma db seed
```

The default admin credentials are:
- **Email**: `admin@bataklineage.com`
- **Password**: `password123`

### 5. Run the Development Server

Start the Next.js development server:

```bash
npm run dev
```

The application should now be running at [http://localhost:9002](http://localhost:9002).

## 🗂️ Project Structure

- `src/app/`: Contains all the pages of the application, following the Next.js App Router structure.
- `src/components/`: Shared React components used across the application.
- `src/lib/`: Core logic, actions, and utility functions.
- `src/services/`: Modules for interacting with the database (e.g., `person.service.ts`).
- `prisma/`: Contains the database schema (`schema.prisma`), migrations, and the seeding script (`seed.ts`).
- `public/`: Static assets like images and fonts.

## 🤝 How to Contribute

Contributions are welcome! If you have ideas for improvements or find any bugs, please feel free to open an issue or submit a pull request.
