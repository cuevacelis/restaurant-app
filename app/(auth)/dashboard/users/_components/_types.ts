export interface User {
  id: string;
  username: string;
  role: "admin" | "waiter" | "chef";
  name: string;
  active: boolean;
  created_at: string;
}

export type UserForm = {
  username: string;
  password: string;
  role: string;
  name: string;
};

export const EMPTY_FORM: UserForm = { username: "", password: "", role: "waiter", name: "" };

export const ROLE_COLORS: Record<string, string> = {
  admin: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
  waiter: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  chef: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
};
