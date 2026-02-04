import axios from 'axios';
import type { Todo, Subtask } from './types';

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

export async function fetchSubtasks(todoId: number): Promise<Subtask[]> {
  const { data } = await api.get<Subtask[]>(`/${todoId}/subtasks`);
  return data;
}

export async function addSubtask(todoId: number, title: string): Promise<Subtask> {
  const { data } = await api.post<Subtask>(`/${todoId}/subtasks`, { title });
  return data;
}

export async function toggleSubtask(todoId: number, subtask: Subtask): Promise<Subtask> {
  const { data } = await api.put<Subtask>(`/${todoId}/subtasks/${subtask.id}`, {
    completed: !subtask.completed,
  });
  return data;
}

export async function deleteSubtask(todoId: number, subtaskId: number): Promise<void> {
  await api.delete(`/${todoId}/subtasks/${subtaskId}`);
}

export function exportJsonUrl(): string {
  return '/api/export/json';
}

export function exportCsvUrl(): string {
  return '/api/export/csv';
}
