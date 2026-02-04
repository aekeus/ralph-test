import axios from 'axios';
import type { Todo } from './types';

const api = axios.create({
  baseURL: '/api/todos',
});

export async function fetchTodos(): Promise<Todo[]> {
  const { data } = await api.get<Todo[]>('/');
  return data;
}

export async function addTodo(title: string): Promise<Todo> {
  const { data } = await api.post<Todo>('/', { title });
  return data;
}

export async function toggleTodo(todo: Todo): Promise<Todo> {
  const { data } = await api.put<Todo>(`/${todo.id}`, {
    completed: !todo.completed,
  });
  return data;
}

export async function deleteTodo(id: number): Promise<void> {
  await api.delete(`/${id}`);
}
