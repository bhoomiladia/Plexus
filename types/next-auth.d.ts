import "next-auth";

declare module "next-auth" {
  interface User {
    id: string;
    email: string;
    name: string;
    title?: string;
    bio?: string;
    skills?: string[];
  }

  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      title?: string;
      bio?: string;
      skills?: string[];
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    title?: string;
    bio?: string;
    skills?: string[];
  }
}
