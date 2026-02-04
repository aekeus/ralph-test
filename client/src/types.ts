export interface Tag {
  id: number;
  name: string;
  color: string;
}

export interface Todo {
  id: number;
  title: string;
  completed: boolean;
  due_date: string | null;
  priority: 'low' | 'medium' | 'high';
  position: number | null;
  created_at: string;
  updated_at: string;
  tags: Tag[];
}

export interface Subtask {
  id: number;
  todo_id: number;
  title: string;
  completed: boolean;
  created_at: string;
  updated_at: string;
}
